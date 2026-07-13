import { useState } from 'react';
import { useTransactions, useCreateTransaction } from '@/hooks/useTransactions';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionFilterBar from '@/components/transactions/TransactionFilters';
import TransactionForm from '@/components/transactions/TransactionForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { Plus, Receipt } from 'lucide-react';
import type { TransactionFilters } from '@/types';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    sort_by: 'date',
    sort_order: 'desc',
  });
  const [showForm, setShowForm] = useState(false);

  const { data: transactions, isLoading, isError, refetch } = useTransactions(filters);
  const createMutation = useCreateTransaction();

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

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Manage your income and expenses"
        action={
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus size={16} />
            Add Transaction
          </Button>
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
    </AnimatedPage>
  );
}
