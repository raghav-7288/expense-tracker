import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { cn } from '@/utils/cn';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { createTransaction } from '@/services/transactions';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';
import type { TransactionType, MergedCategory } from '@/types';

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ParsedRow {
  date: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  notes: string;
  error?: string;
}

type ImportStatus = 'idle' | 'preview' | 'importing' | 'done';

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function validateDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}

function parseCSV(content: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  if (lines.length < 2) {
    errors.push('CSV file must have a header row and at least one data row.');
    return { rows, errors };
  }

  const header = parseCSVLine(lines[0]!).map((h) => h.toLowerCase());
  const dateIdx = header.indexOf('date');
  const typeIdx = header.indexOf('type');
  const categoryIdx = header.indexOf('category');
  const descIdx = header.indexOf('description');
  const amountIdx = header.indexOf('amount');
  const notesIdx = header.indexOf('notes');

  if (dateIdx === -1 || typeIdx === -1 || descIdx === -1 || amountIdx === -1) {
    errors.push('CSV must have at least these headers: Date, Type, Description, Amount');
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]!);
    const date = fields[dateIdx]?.trim() ?? '';
    const type = fields[typeIdx]?.trim().toLowerCase() ?? '';
    const category = categoryIdx !== -1 ? (fields[categoryIdx]?.trim() ?? '') : '';
    const description = fields[descIdx]?.trim() ?? '';
    const amountStr = fields[amountIdx]?.trim() ?? '';
    const notes = notesIdx !== -1 ? (fields[notesIdx]?.trim() ?? '') : '';

    const row: ParsedRow = {
      date,
      type: type as TransactionType,
      category,
      description,
      amount: parseFloat(amountStr),
      notes,
    };

    // Validate
    const rowErrors: string[] = [];
    if (!validateDate(date)) rowErrors.push('invalid date');
    if (type !== 'income' && type !== 'expense') rowErrors.push('type must be income or expense');
    if (!description) rowErrors.push('description is required');
    if (isNaN(row.amount) || row.amount <= 0) rowErrors.push('amount must be > 0');

    if (rowErrors.length > 0) {
      row.error = `Row ${i + 1}: ${rowErrors.join(', ')}`;
    }

    rows.push(row);
  }

  return { rows, errors };
}

export default function CSVImportModal({ open, onClose }: CSVImportModalProps) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { data: expenseCategories } = useCategories('expense');
  const { data: incomeCategories } = useCategories('income');
  const queryClient = useQueryClient();

  const allCategories = useMemo(
    () => [...(expenseCategories ?? []), ...(incomeCategories ?? [])],
    [expenseCategories, incomeCategories],
  );

  const findCategory = useCallback(
    (name: string, type: TransactionType): MergedCategory | undefined => {
      return allCategories.find(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.type === type,
      );
    },
    [allCategories],
  );

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const { rows, errors } = parseCSV(content);
      setParsedRows(rows);
      setParseErrors(errors);
      setStatus('preview');
    };
    reader.readAsText(file);

    // Reset file input for re-upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleImport() {
    if (!user) return;

    const validRows = parsedRows.filter((r) => !r.error);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setStatus('importing');
    setImportProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]!;
      const category = findCategory(row.category, row.type);

      const { error } = await createTransaction({
        user_id: user.id,
        type: row.type,
        amount: row.amount,
        description: row.description,
        category_id: category?.id ?? null,
        date: row.date,
        notes: row.notes || null,
      });

      if (error) {
        failed++;
      } else {
        success++;
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults({ success, failed });
    setStatus('done');

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });

    if (success > 0) {
      toast.success(`Imported ${success} transaction${success > 1 ? 's' : ''}`);
    }
    if (failed > 0) {
      toast.error(`${failed} transaction${failed > 1 ? 's' : ''} failed to import`);
    }
  }

  function handleClose() {
    setStatus('idle');
    setParsedRows([]);
    setParseErrors([]);
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0 });
    onClose();
  }

  const validCount = parsedRows.filter((r) => !r.error).length;
  const errorCount = parsedRows.filter((r) => r.error).length;

  return (
    <Modal open={open} onClose={handleClose} title="Import CSV" size="lg">
      <div className="space-y-4">
        {status === 'idle' && (
          <>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Upload a CSV file to import transactions in bulk.</p>
              <p className="font-medium">Expected format:</p>
              <code className="block bg-gray-50 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto">
                Date,Type,Category,Description,Amount,Notes
                <br />
                2026-07-15,expense,Food & Dining,Lunch,12.50,Team lunch
              </code>
              <p className="text-xs text-gray-500">
                • Date format: YYYY-MM-DD<br />
                • Type: income or expense<br />
                • Category: matched by name (optional)<br />
                • Amount: positive number
              </p>
            </div>

            <label
              htmlFor="csv-file-input"
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-8',
                'border-2 border-dashed border-gray-200 rounded-lg',
                'hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer',
              )}
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Click to select CSV file
              </span>
              <span className="text-xs text-gray-400">or drag and drop</span>
              <input
                ref={fileInputRef}
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </label>
          </>
        )}

        {status === 'preview' && (
          <>
            {parseErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            {parsedRows.length > 0 && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-green-700">
                    <CheckCircle2 size={14} />
                    {validCount} valid
                  </span>
                  {errorCount > 0 && (
                    <span className="flex items-center gap-1.5 text-red-600">
                      <AlertCircle size={14} />
                      {errorCount} with errors
                    </span>
                  )}
                  <span className="text-gray-500">
                    ({parsedRows.length} total rows)
                  </span>
                </div>

                <div className="max-h-60 overflow-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">#</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Date</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Type</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Category</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Description</th>
                        <th className="px-2 py-1.5 text-right font-medium text-gray-600">Amount</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRows.map((row, i) => (
                        <tr
                          key={i}
                          className={cn(row.error && 'bg-red-50/50')}
                        >
                          <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                          <td className="px-2 py-1.5">{row.date}</td>
                          <td className="px-2 py-1.5">
                            <span className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                              row.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                            )}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 max-w-[100px] truncate">
                            {row.category || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-2 py-1.5 max-w-[120px] truncate">{row.description}</td>
                          <td className="px-2 py-1.5 text-right">{isNaN(row.amount) ? '—' : row.amount.toFixed(2)}</td>
                          <td className="px-2 py-1.5">
                            {row.error ? (
                              <span className="text-red-600" title={row.error}>
                                <X size={12} />
                              </span>
                            ) : (
                              <span className="text-green-600">
                                <CheckCircle2 size={12} />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {errorCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      Rows with errors will be skipped. Only {validCount} valid row{validCount !== 1 ? 's' : ''} will be imported.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setStatus('idle')} className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0}
                    className="flex-1"
                  >
                    <Upload size={14} />
                    Import {validCount} Transaction{validCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {status === 'importing' && (
          <div className="py-8 space-y-4 text-center">
            <div className="flex items-center justify-center">
              <FileText size={32} className="text-primary-500 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Importing transactions…
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{importProgress}% complete</p>
          </div>
        )}

        {status === 'done' && (
          <div className="py-6 space-y-4 text-center">
            <div className="flex items-center justify-center">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Import Complete</p>
              <p className="text-sm text-gray-600 mt-1">
                {importResults.success} imported successfully
                {importResults.failed > 0 && `, ${importResults.failed} failed`}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}



