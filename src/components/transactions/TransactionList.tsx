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
import {
  useUpdateTransaction,
  useDeleteTransaction,
  useUpdateLoanTransaction,
  useDeleteLoanTransaction,
} from '@/hooks/useTransactions';
import { Edit, Trash2, HandCoins } from 'lucide-react';
import type { Transaction } from '@/types';

interface TransactionListProps {
  transactions: Transaction[];
}

/**
 * Loan transactions (`lent` / `borrowed`) are disbursement/repayment records
 * owned by a loan. They can now be edited/deleted from here and changes
 * automatically sync back to the parent loan's outstanding_amount/status.
 */
function isLoanTransaction(t: Transaction): boolean {
  return t.type === 'lent' || t.type === 'borrowed';
}

export default function TransactionList({ transactions }: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const currency = useCurrency();

  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const updateLoanMutation = useUpdateLoanTransaction();
  const deleteLoanMutation = useDeleteLoanTransaction();

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editingTransaction) return;

    if (isLoanTransaction(editingTransaction) && editingTransaction.loan_info) {
      // Loan-linked: use the loan-aware update that syncs outstanding_amount
      await updateLoanMutation.mutateAsync({
        id: editingTransaction.id,
        input: {
          amount: data.amount as number,
          account_id: (data.account_id as string) || null,
          date: data.date as string,
          notes: data.notes as string,
        },
        loanId: editingTransaction.loan_info.loan_id,
      });
    } else {
      await updateMutation.mutateAsync({
        id: editingTransaction.id,
        input: {
          type: data.type as 'income' | 'expense' | 'lent' | 'borrowed',
          amount: data.amount as number,
          category_id: (data.category_id as string) || null,
          account_id: (data.account_id as string) || null,
          date: data.date as string,
          notes: data.notes as string,
        },
      });
    }
    setEditingTransaction(null);
  }

  async function handleDelete(id: string) {
    const txn = transactions.find((t) => t.id === id);
    if (txn && isLoanTransaction(txn) && txn.loan_info) {
      // Loan-linked: use the loan-aware delete that syncs outstanding_amount
      await deleteLoanMutation.mutateAsync({
        id,
        loanId: txn.loan_info.loan_id,
        eventType: txn.loan_info.event_type,
      });
    } else {
      await deleteMutation.mutateAsync(id);
    }
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
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="group hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.notes} color={t.categories?.color ?? '#6b7280'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {t.notes}
                        </p>
                        {t.account && (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: t.account.color }}
                            />
                            {t.account.name}
                          </span>
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
                    ) : isLoanTransaction(t) ? (
                      <span className={cn(
                        'inline-flex items-center gap-1.5 text-xs',
                        t.type === 'lent' ? 'text-blue-600' : 'text-amber-600',
                      )}>
                        <span className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          t.type === 'lent' ? 'bg-blue-400' : 'bg-amber-400',
                        )} />
                        {t.loan_info?.event_type === 'repayment' ? 'Loan Repayment' : 'Loan Disbursement'}
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
                        t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-red-600' : t.type === 'lent' ? 'text-blue-600' : 'text-amber-600',
                    )}
                    >
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.type === 'lent' ? '↗' : '↙'}{formatCurrency(Number(t.amount), currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      {isLoanTransaction(t) && t.loan_info && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 px-1.5 py-0.5 rounded bg-blue-50 mr-1"
                          title={`Linked to loan: ${t.loan_info.loan?.counterparty_name ?? ''} (${t.loan_info.event_type})`}
                        >
                          <HandCoins size={11} />
                          {t.loan_info.event_type === 'disbursement' ? 'Loan' : 'Repay'}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTransaction(t)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                          aria-label="Edit transaction"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
            <Avatar name={t.notes} color={t.categories?.color ?? '#6b7280'} />

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{t.notes}</p>
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums flex-shrink-0',
                    t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-red-600' : t.type === 'lent' ? 'text-blue-600' : 'text-amber-600',
                  )}
                >
                  {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.type === 'lent' ? '↗' : '↙'}{formatCurrency(Number(t.amount), currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 overflow-hidden">
                <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDateShort(t.date)}</span>
                {t.categories ? (
                  <>
                    <span className="text-[11px] text-gray-200">·</span>
                    <span className="text-[11px] text-gray-400 truncate">{t.categories.name}</span>
                  </>
                ) : isLoanTransaction(t) && (
                  <>
                    <span className="text-[11px] text-gray-200">·</span>
                    <span className={cn(
                      'text-[11px] truncate',
                      t.type === 'lent' ? 'text-blue-500' : 'text-amber-500',
                    )}>
                      {t.loan_info?.event_type === 'repayment' ? 'Loan Repayment' : 'Loan Disbursement'}
                    </span>
                  </>
                )}
                {t.account && (
                  <>
                    <span className="text-[11px] text-gray-200">·</span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 truncate">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.account.color }}
                      />
                      {t.account.name}
                    </span>
                  </>
                )}
                <Badge type={t.type} className="ml-auto flex-shrink-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              {isLoanTransaction(t) && t.loan_info && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 px-1.5 py-0.5 rounded bg-blue-50 self-end"
                  title={`Linked: ${t.loan_info.loan?.counterparty_name ?? ''}`}
                >
                  <HandCoins size={10} />
                  {t.loan_info.event_type === 'disbursement' ? 'Loan' : 'Repay'}
                </span>
              )}
              <button
                onClick={() => setEditingTransaction(t)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                aria-label="Edit transaction"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setDeletingId(t.id)}
                className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
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
        title={
          editingTransaction?.loan_info
            ? `Edit ${editingTransaction.loan_info.event_type === 'disbursement' ? 'Loan' : 'Repayment'} Transaction`
            : 'Edit Transaction'
        }
      >
        {editingTransaction && (
          <TransactionForm
            initialData={editingTransaction}
            onSubmit={handleUpdate}
            onCancel={() => setEditingTransaction(null)}
            loading={updateMutation.isPending || updateLoanMutation.isPending}
            isLoanLinked={!!editingTransaction.loan_info}
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
        {(() => {
          const txn = deletingId ? transactions.find((t) => t.id === deletingId) : null;
          const isLoan = txn && isLoanTransaction(txn) && txn.loan_info;
          const isDisbursement = isLoan && txn.loan_info?.event_type === 'disbursement';

          return (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {isDisbursement
                  ? `This is a loan disbursement. Deleting it will remove the entire loan (${txn.loan_info?.loan?.counterparty_name ?? ''}) and all its repayment records. This cannot be undone.`
                  : isLoan
                    ? `This is a loan repayment. Deleting it will add the amount back to the loan's outstanding balance (${txn.loan_info?.loan?.counterparty_name ?? ''}). This cannot be undone.`
                    : 'Are you sure you want to delete this transaction? This action cannot be undone.'
                }
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setDeletingId(null)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  loading={deleteMutation.isPending || deleteLoanMutation.isPending}
                  onClick={() => deletingId && handleDelete(deletingId)}
                  className="flex-1"
                >
                  {isDisbursement ? 'Delete Loan' : 'Delete'}
                </Button>
              </div>
            </>
          );
        })()}
      </Modal>
    </>
  );
}
