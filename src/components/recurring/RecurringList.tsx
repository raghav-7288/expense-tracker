import { useState } from 'react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RecurringForm, { type RecurringFormData } from '@/components/recurring/RecurringForm';
import {
  useUpdateRecurringTransaction,
  useDeleteRecurringTransaction,
} from '@/hooks/useRecurringTransactions';
import { Edit, Trash2, Pause, Play, Repeat } from 'lucide-react';
import type { RecurringTransaction, RecurrenceFrequency } from '@/types';

interface RecurringListProps {
  rules: RecurringTransaction[];
}

const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function RecurringList({ rules }: RecurringListProps) {
  const [editingRule, setEditingRule] = useState<RecurringTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const currency = useCurrency();

  const updateMutation = useUpdateRecurringTransaction();
  const deleteMutation = useDeleteRecurringTransaction();

  async function handleUpdate(data: RecurringFormData) {
    if (!editingRule) return;
    await updateMutation.mutateAsync({
      id: editingRule.id,
      input: {
        type: data.type,
        amount: data.amount,
        notes: data.notes,
        category_id: data.category_id ?? null,
        account_id: data.account_id ?? null,
        frequency: data.frequency,
        end_date: data.end_date ?? null,
      },
    });
    setEditingRule(null);
  }

  function handleToggleActive(rule: RecurringTransaction) {
    updateMutation.mutate({ id: rule.id, input: { is_active: !rule.is_active } });
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
  }

  return (
    <>
      <div className="space-y-2">
        {rules.map((r) => (
          <div
            key={r.id}
            className={cn(
              'bg-white rounded-xl border shadow-sm p-3 sm:p-4 flex items-center gap-3 overflow-hidden transition-opacity',
              r.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60',
            )}
          >
            <Avatar name={r.notes} color={r.categories?.color ?? '#6b7280'} />

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">{r.notes}</p>
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums flex-shrink-0',
                    r.type === 'income' ? 'text-emerald-600' : 'text-red-600',
                  )}
                >
                  {r.type === 'income' ? '+' : '-'}
                  {formatCurrency(Number(r.amount), currency)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 overflow-hidden flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded flex-shrink-0">
                  <Repeat size={10} />
                  {FREQUENCY_LABEL[r.frequency]}
                </span>
                {r.is_active ? (
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    Next: {formatDate(r.next_due_date)}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600 flex-shrink-0">Paused</span>
                )}
                {r.categories && (
                  <>
                    <span className="text-[11px] text-gray-200">·</span>
                    <span className="text-[11px] text-gray-400 truncate">{r.categories.name}</span>
                  </>
                )}
                {r.account && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400 truncate">
                    <span className="text-[11px] text-gray-200">·</span>
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: r.account.color }}
                    />
                    {r.account.name}
                  </span>
                )}
                {r.end_date && (
                  <>
                    <span className="text-[11px] text-gray-200">·</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      Ends {formatDate(r.end_date)}
                    </span>
                  </>
                )}
                <Badge type={r.type} className="ml-auto flex-shrink-0" />
              </div>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => handleToggleActive(r)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                aria-label={r.is_active ? 'Pause recurring transaction' : 'Resume recurring transaction'}
                title={r.is_active ? 'Pause' : 'Resume'}
              >
                {r.is_active ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={() => setEditingRule(r)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                aria-label="Edit recurring transaction"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setDeletingId(r.id)}
                className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                aria-label="Delete recurring transaction"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingRule}
        onClose={() => setEditingRule(null)}
        title="Edit Recurring Transaction"
      >
        {editingRule && (
          <RecurringForm
            initialData={editingRule}
            onSubmit={handleUpdate}
            onCancel={() => setEditingRule(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Delete Recurring Transaction"
        description="This stops future transactions from being generated. Transactions already created from this schedule are kept."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
}

