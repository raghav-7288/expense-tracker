import { useState } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import TransactionForm from '@/components/transactions/TransactionForm';
import { useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { Edit, Trash2 } from 'lucide-react';
import type { Transaction } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editingTransaction) return;
    await updateMutation.mutateAsync({
      id: editingTransaction.id,
      input: {
        type: data.type as 'income' | 'expense',
        amount: data.amount as number,
        description: data.description as string,
        category_id: (data.category_id as string) || null,
        date: data.date as string,
        notes: (data.notes as string) || null,
      },
    });
    setEditingTransaction(null);
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: t.categories?.color ?? '#6b7280' }}
            >
              <span className="text-white text-sm font-medium">
                {t.description.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                <Badge type={t.type} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{formatDate(t.date)}</span>
                {t.categories && (
                  <>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-500">{t.categories.name}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`text-sm font-semibold ${
                  t.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
              </span>
              <button
                onClick={() => setEditingTransaction(t)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Edit transaction"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => setDeletingId(t.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Delete transaction"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="Edit Transaction"
      >
        {editingTransaction && (
          <TransactionForm
            initialData={editingTransaction}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTransaction(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Transaction"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeletingId(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deletingId && handleDelete(deletingId)}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

