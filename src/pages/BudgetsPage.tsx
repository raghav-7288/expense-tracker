import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudgetProgress, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useCurrency } from '@/hooks/useCurrency';
import { formatCurrency } from '@/utils/formatCurrency';
import { cn } from '@/utils/cn';
import { staggerContainer, staggerItem, gentle } from '@/utils/animations';
import ErrorState from '@/components/ui/ErrorState';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import BudgetForm from '@/components/budgets/BudgetForm';
import { Target, Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import type { Budget, BudgetProgress, CreateBudgetInput, UpdateBudgetInput } from '@/types';

export default function BudgetsPage() {
  const { data: progress, isLoading, isError, refetch } = useBudgetProgress();
  const currency = useCurrency();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load budgets"
        description="We couldn't fetch your budget data. Please try again."
        retry={() => { refetch(); }}
      />
    );
  }

  function handleCreate(input: Omit<CreateBudgetInput, 'user_id'>) {
    createMutation.mutate(input, {
      onSuccess: () => setShowForm(false),
    });
  }

  function handleUpdate(input: UpdateBudgetInput) {
    if (!editingBudget) return;
    updateMutation.mutate(
      { id: editingBudget.id, input },
      { onSuccess: () => setEditingBudget(null) },
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Budgets</h1>
          <p className="text-sm text-gray-500 mt-0.5">Set spending limits and track your progress</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingBudget(null); }} size="sm">
          <Plus size={14} />
          Add Budget
        </Button>
      </div>

      {/* Form Dialog */}
      <AnimatePresence mode="wait">
        {(showForm || editingBudget) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={gentle}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                {editingBudget ? 'Edit Budget' : 'New Budget'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingBudget(null); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                aria-label="Close form"
              >
                <X size={16} />
              </button>
            </div>
            <BudgetForm
              key={editingBudget?.id ?? 'new'}
              budget={editingBudget}
              onSubmit={(input) => {
                if (editingBudget) {
                  handleUpdate(input as UpdateBudgetInput);
                } else {
                  handleCreate(input as Omit<CreateBudgetInput, 'user_id'>);
                }
              }}
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !progress || progress.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
            <Target size={28} className="text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">No budgets yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm leading-relaxed">
            Create your first budget to start tracking spending limits per category.
          </p>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus size={14} />
            Create Budget
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {progress.map((item) => (
            <BudgetCard
              key={item.budget.id}
              item={item}
              currency={currency}
              onEdit={() => setEditingBudget(item.budget)}
              onDelete={() => handleDelete(item.budget.id)}
              deleting={deleteMutation.isPending}
              confirmingDelete={confirmDeleteId === item.budget.id}
              onConfirmDelete={() => setConfirmDeleteId(item.budget.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Budget Card ──────────────────────────────────────────────────

interface BudgetCardProps {
  item: BudgetProgress;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

function BudgetCard({ item, currency, onEdit, onDelete, deleting, confirmingDelete, onConfirmDelete, onCancelDelete }: BudgetCardProps) {
  const categoryName = item.budget.category?.name ?? 'Unknown';
  const categoryColor = item.budget.category?.color ?? '#6b7280';
  const pct = Math.min(item.percentage, 100);

  return (
    <motion.div
      variants={staggerItem}
      transition={gentle}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${categoryColor}15` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{categoryName}</p>
            <p className="text-xs text-gray-400 capitalize">{item.budget.period}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!confirmingDelete ? (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={`Edit ${categoryName} budget`}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onConfirmDelete}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Delete ${categoryName} budget`}
              >
                <Trash2 size={13} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                disabled={deleting}
                className="px-2 py-1 rounded-md bg-red-500 text-white text-[10px] font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                aria-label="Confirm delete"
              >
                {deleting ? '...' : 'Delete'}
              </button>
              <button
                onClick={onCancelDelete}
                className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium hover:bg-gray-200 transition-colors"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              item.status === 'exceeded' && 'bg-red-500',
              item.status === 'warning' && 'bg-amber-500',
              item.status === 'on_track' && 'bg-emerald-500',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {formatCurrency(item.spent, currency)} of {formatCurrency(item.budget.amount, currency)}
        </span>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            item.status === 'exceeded' && 'text-red-600',
            item.status === 'warning' && 'text-amber-600',
            item.status === 'on_track' && 'text-emerald-600',
          )}
        >
          {Math.round(item.percentage)}%
        </span>
      </div>

      {item.status === 'exceeded' && (
        <p className="text-[11px] text-red-500 mt-1.5 font-medium">
          Over by {formatCurrency(item.spent - item.budget.amount, currency)}
        </p>
      )}
      {item.status === 'warning' && (
        <p className="text-[11px] text-amber-600 mt-1.5 font-medium flex items-center gap-1">
          <AlertTriangle size={10} />
          Only {formatCurrency(item.remaining, currency)} remaining
        </p>
      )}
      {item.status === 'on_track' && item.remaining > 0 && (
        <p className="text-[11px] text-gray-400 mt-1.5">
          {formatCurrency(item.remaining, currency)} remaining
        </p>
      )}
    </motion.div>
  );
}


