import { Download } from 'lucide-react';
import { generateCSV, downloadFile } from '@/engines/analytics';
import Button from '@/components/ui/Button';
import type { Transaction } from '@/types';

interface ExportButtonProps {
  transactions: Transaction[];
}

export default function ExportButton({ transactions }: ExportButtonProps) {
  function handleExportCSV() {
    const csv = generateCSV(transactions);
    const date = new Date().toISOString().split('T')[0] ?? 'export';
    downloadFile(csv, `expense-tracker-${date}.csv`, 'text/csv');
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleExportCSV}
      disabled={transactions.length === 0}
    >
      <Download size={14} />
      Export CSV
    </Button>
  );
}

