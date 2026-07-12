import { useState } from 'react';
import { useTransactions, useCreateTransaction } from '@/hooks/useTransactions';
import TransactionList from '@/components/transactions/TransactionList';
import TransactionFilterBar from '@/components/transactions/TransactionFilters';
import TransactionForm from '@/components/transactions/TransactionForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, Receipt } from 'lucide-react';
import type { TransactionFilters } from '@/types';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({
    sort_by: 'date',
    sort_order: 'desc',
  });
  const [showForm, setShowForm] = useState(false);

  const { data: transactions, isLoading } = useTransactions(filters);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your income and expenses
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Add Transaction
        </Button>
      </div>

      <TransactionFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <Spinner size={32} />
      ) : !transactions || transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt size={48} />}
          title="No transactions found"
          description={
            filters.search || filters.type !== undefined || filters.category_id
              ? 'Try adjusting your filters'
              : "You haven't added any transactions yet. Start tracking your finances!"
          }
          action={
            !filters.search && (
              <Button onClick={() => setShowForm(true)}>
                <Plus size={16} />
                Add Transaction
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
    </div>
  );
}

