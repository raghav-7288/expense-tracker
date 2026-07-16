import { useState } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateShort } from '@/utils/formatDate';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';
import Avatar from '@/components/ui/Avatar';
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
  const currency = useCurrency();

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
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Transactions">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="text-right px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="w-20 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => (
                <tr key={t.id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.description} color={t.categories?.color ?? '#6b7280'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {t.description}
                        </p>
                        {t.notes && (
                          <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{t.notes}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.categories ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.categories.color }}
                        />
                        {t.categories.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{formatDate(t.date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge type={t.type} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn('text-sm font-semibold tabular-nums',
                        t.type === 'income' ? 'text-emerald-600' : 'text-red-600',
                    )}
                    >
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingTransaction(t)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        aria-label="Edit transaction"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(t.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                        aria-label="Delete transaction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 flex items-center gap-3 overflow-hidden"
          >
            <Avatar name={t.description} color={t.categories?.color ?? '#6b7280'} />

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums flex-shrink-0',
                    t.type === 'income' ? 'text-emerald-600' : 'text-red-600',
                  )}
                >
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount), currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 overflow-hidden">
                <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDateShort(t.date)}</span>
                {t.categories && (
                  <>
                    <span className="text-[11px] text-gray-200">·</span>
                    <span className="text-[11px] text-gray-400 truncate">{t.categories.name}</span>
                  </>
                )}
                <Badge type={t.type} className="ml-auto flex-shrink-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => setEditingTransaction(t)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label="Edit transaction"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setDeletingId(t.id)}
                className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                aria-label="Delete transaction"
              >
                <Trash2 size={14} />
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
