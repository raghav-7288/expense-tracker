import { useState, useRef, useEffect } from 'react';
import { useTransactions, useCreateTransaction } from '@/hooks/useTransactions';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionFilterBar from '@/components/transactions/TransactionFilters';
import TransactionForm from '@/components/transactions/TransactionForm';
import CSVImportModal from '@/components/transactions/CSVImportModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Plus, ChevronDown, Upload, Download, Receipt } from 'lucide-react';
import { generateCSV, downloadFile } from '@/engines/analytics';
import type { TransactionFilters } from '@/types';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    sort_by: 'date',
    sort_order: 'desc',
  });
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCSVMenu, setShowCSVMenu] = useState(false);
  const csvMenuRef = useRef<HTMLDivElement>(null);

  const { data: transactions, isLoading, isError, refetch } = useTransactions(filters);
  const createMutation = useCreateTransaction();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (csvMenuRef.current && !csvMenuRef.current.contains(e.target as Node)) {
        setShowCSVMenu(false);
      }
    }
    if (showCSVMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCSVMenu]);

  async function handleCreate(data: Record<string, unknown>) {
    await createMutation.mutateAsync({
      type: data.type as 'income' | 'expense',
      amount: data.amount as number,
      description: data.description as string,
      category_id: (data.category_id as string) || null,
      date: data.date as string,
      notes: (data.notes as string) || null,
    });
    setShowForm(false);
  }

  function handleExportCSV() {
    if (!transactions || transactions.length === 0) return;
    const csv = generateCSV(transactions);
    const date = new Date().toISOString().split('T')[0] ?? 'export';
    downloadFile(csv, `transactions-${date}.csv`, 'text/csv');
    setShowCSVMenu(false);
  }

  function handleImportCSV() {
    setShowImport(true);
    setShowCSVMenu(false);
  }

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Manage your income and expenses"
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* CSV dropdown */}
            <div className="relative" ref={csvMenuRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCSVMenu((v) => !v)}
                className="w-full sm:w-auto"
              >
                CSV
                <ChevronDown size={14} className={showCSVMenu ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </Button>
              {showCSVMenu && (
                <div className="absolute right-0 sm:right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={handleExportCSV}
                    disabled={!transactions || transactions.length === 0}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button
                    onClick={handleImportCSV}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Upload size={14} />
                    Import
                  </button>
                </div>
              )}
            </div>

            <Button onClick={() => setShowForm(true)} className="flex-1 sm:flex-initial sm:w-auto">
              <Plus size={16} />
              <span className="sm:inline">Add</span>
            </Button>
          </div>
        }
      />

      <TransactionFilterBar
        filters={filters}
        onChange={setFilters}
        resultCount={transactions?.length}
      />

      {isError ? (
        <ErrorState
          title="Failed to load transactions"
          description="We couldn't fetch your transactions. Please try again."
          retry={() => { refetch(); }}
        />
      ) : isLoading ? (
        <SkeletonTable rows={6} />
      ) : !transactions || transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt size={28} />}
          title={
            filters.search || (filters.type && filters.type !== 'all') || filters.category_id
              ? 'No matching transactions'
              : 'Start tracking your money'
          }
          description={
            filters.search || (filters.type && filters.type !== 'all') || filters.category_id
              ? 'Try changing your search term or removing some filters to see results.'
              : "Add your first income or expense to begin building your financial picture. It only takes a few seconds!"
          }
          action={
            filters.search || (filters.type && filters.type !== 'all') || filters.category_id ? (
              <Button variant="secondary" size="sm" onClick={() => setFilters({ sort_by: 'date', sort_order: 'desc' })}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} />
                Add Your First Transaction
              </Button>
            )
          }
        />
      ) : (
        <TransactionList transactions={transactions} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Add Transaction"
      >
        <TransactionForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      <CSVImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
      />
    </AnimatedPage>
  );
}
