import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils/cn';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { getToday } from '@/utils/formatDate';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/utils/constants';
import { FileText, Calendar, Repeat, Plus, Tag, IndianRupee, DollarSign, Euro, PoundSterling, JapaneseYen } from 'lucide-react';
import type { Transaction, TransactionType } from '@/types';

const transactionSchema = z
  .object({
    type: z.enum(['income', 'expense', 'lent', 'borrowed']),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    category_id: z.string().optional().transform((v) => v || undefined),
    account_id: z.string().optional().transform((v) => v || undefined),
    date: z.string().min(1, 'Date is required'),
    notes: z.string().min(1, 'Description is required').max(500),
    // Recurrence — only surfaced when `allowRecurring` is set on the form.
    // The `date` field doubles as the recurrence start date.
    is_recurring: z.boolean().optional().default(false),
    frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
    end_date: z.string().optional().transform((v) => v || undefined),
  })
  .superRefine((data, ctx) => {
    if (data.is_recurring && !data.frequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['frequency'],
        message: 'Choose how often it repeats',
      });
    }
    if (data.is_recurring && data.end_date && data.end_date < data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'End date must be after the start date',
      });
    }
  });

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  /** When true, type is locked (loan-linked transaction). */
  isLoanLinked?: boolean;
  /** When true, shows the "repeat this transaction" recurrence controls. */
  allowRecurring?: boolean;
}

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'yearly', label: 'Every year' },
];

function getCurrencyIcon(currency: string) {
  switch (currency) {
    case 'INR': return <IndianRupee size={15} />;
    case 'EUR': return <Euro size={15} />;
    case 'GBP': return <PoundSterling size={15} />;
    case 'JPY': return <JapaneseYen size={15} />;
    default: return <DollarSign size={15} />;
  }
}

export default function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  isLoanLinked = false,
  allowRecurring = false,
}: TransactionFormProps) {
  const currency = useCurrency();
  const { data: accounts } = useAccounts();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: {
      type: initialData?.type ?? 'expense',
      amount: initialData ? Number(initialData.amount) : undefined,
      category_id: initialData?.category_id ?? '',
      account_id: initialData?.account_id ?? '',
      date: initialData?.date ?? getToday(),
      notes: initialData?.notes ?? '',
      is_recurring: false,
      frequency: 'monthly',
      end_date: '',
    },
  });

  const selectedType = watch('type') as TransactionType;
  const isRecurring = watch('is_recurring');
  const { data: categories } = useCategories(selectedType);

  // ── Inline "create category" panel state ────────────────────────────────
  const createCategoryMutation = useCreateCategory();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(CATEGORY_COLORS[0]);
  const [newIcon, setNewIcon] = useState<string>(CATEGORY_ICONS[0]);
  // Category to select once it appears in the refreshed list (post-create).
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  const iconOptions = CATEGORY_ICONS.map((icon) => ({
    value: icon,
    label: icon.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  // Once the newly created category is present in the (refetched) list, select
  // it. Waiting avoids assigning a value the native <select> can't match yet.
  useEffect(() => {
    if (!pendingCategoryId) return;
    if ((categories ?? []).some((c) => c.id === pendingCategoryId)) {
      setValue('category_id', pendingCategoryId);
      setPendingCategoryId(null);
    }
  }, [categories, pendingCategoryId, setValue]);

  function resetNewCategory() {
    setShowNewCategory(false);
    setNewName('');
    setNewColor(CATEGORY_COLORS[0]);
    setNewIcon(CATEGORY_ICONS[0]);
  }

  async function handleCreateCategory() {
    const name = newName.trim();
    if (!name) return;
    const created = await createCategoryMutation.mutateAsync({
      name,
      // Category type follows the transaction type (income/expense only).
      type: selectedType === 'income' ? 'income' : 'expense',
      color: newColor,
      icon: newIcon,
    });
    if (created?.id) setPendingCategoryId(created.id);
    resetNewCategory();
  }

  const categoryOptions = (categories ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const accountOptions = (accounts ?? []).map((a) => ({
    value: a.id,
    label: a.name,
  }));

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4 sm:space-y-5">
      {/* Type toggle — locked for loan-linked transactions */}
      {isLoanLinked ? (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Transaction type</p>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
            <span className={`text-sm font-bold ${initialData?.type === 'lent' ? 'text-blue-600' : 'text-amber-600'}`}>
              {initialData?.type === 'lent' ? '↗ Lent' : '↙ Borrowed'}
            </span>
            <span className="text-[11px] text-gray-400 ml-auto">Linked to loan — type locked</span>
            <input type="hidden" {...register('type')} />
          </div>
          {initialData?.loan_info?.loan && (
            <p className="text-xs text-gray-500 mt-1.5">
              {initialData.loan_info.event_type === 'disbursement' ? 'Disbursement to' : 'Repayment from'}{' '}
              <span className="font-medium text-gray-700">{initialData.loan_info.loan.counterparty_name}</span>
            </p>
          )}
        </div>
      ) : (
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">Transaction type</legend>
          <div className="txn-type-group grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-gray-100">
            <label className="relative cursor-pointer touch-manipulation">
              <input type="radio" value="expense" {...register('type')} className="peer sr-only" />
              <div className="txn-type-option txn-type-expense rounded-lg py-3 sm:py-2.5 text-center text-sm font-bold transition-all peer-checked:bg-rose-500 peer-checked:text-white peer-checked:shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500/40">
                Expense
              </div>
            </label>
            <label className="relative cursor-pointer touch-manipulation">
              <input type="radio" value="income" {...register('type')} className="peer sr-only" />
              <div className="txn-type-option txn-type-income rounded-lg py-3 sm:py-2.5 text-center text-sm font-bold transition-all peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40">
                Income
              </div>
            </label>
          </div>
        </fieldset>
      )}

      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        leftIcon={getCurrencyIcon(currency)}
        error={errors.amount?.message}
        {...register('amount')}
      />

      <Input
        label="Notes"
        placeholder="e.g. Grocery shopping at Trader Joe's"
        leftIcon={<FileText size={15} />}
        error={errors.notes?.message}
        {...register('notes')}
      />

      {!isLoanLinked && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors touch-manipulation"
            >
              <Plus size={12} />
              New category
            </button>
          </div>

          <Select
            id="category_id"
            options={categoryOptions}
            placeholder="Select a category"
            error={errors.category_id?.message}
            {...register('category_id')}
          />

          {showNewCategory && (
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-3">
              <p className="text-xs font-medium text-gray-500">
                New {selectedType === 'income' ? 'income' : 'expense'} category
              </p>

              <Input
                label="Name"
                placeholder="e.g. Groceries"
                leftIcon={<Tag size={15} />}
                maxLength={50}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />

              <Select
                label="Icon"
                options={iconOptions}
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
              />

              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-gray-700">Color</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all touch-manipulation',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                        newColor === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-110',
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                      aria-pressed={newColor === color}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={resetNewCategory}
                  className="flex-1 touch-manipulation"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  loading={createCategoryMutation.isPending}
                  disabled={!newName.trim()}
                  onClick={() => { void handleCreateCategory(); }}
                  className="flex-1 touch-manipulation"
                >
                  Create &amp; select
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {accountOptions.length > 0 && (
        <Select
          label="Account"
          options={accountOptions}
          placeholder="No account (general)"
          error={errors.account_id?.message}
          {...register('account_id')}
        />
      )}

      <Input
        label="Date"
        type="date"
        leftIcon={<Calendar size={15} />}
        error={errors.date?.message}
        {...register('date')}
      />

      {/* Recurrence — create flow only (hidden for loan-linked / edit). */}
      {allowRecurring && !isLoanLinked && (
        <div className="rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3 bg-gray-50/50">
          <label className="flex items-center justify-between gap-3 cursor-pointer touch-manipulation">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Repeat size={15} className="text-gray-400" />
              Repeat this transaction
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 accent-primary-600 focus:ring-2 focus:ring-primary-500/30"
              {...register('is_recurring')}
            />
          </label>

          {isRecurring && (
            <div className="space-y-3 pt-1">
              <Select
                label="Frequency"
                options={FREQUENCY_OPTIONS}
                error={errors.frequency?.message}
                {...register('frequency')}
              />
              <Input
                label="End date (optional)"
                type="date"
                leftIcon={<Calendar size={15} />}
                helperText="Leave blank to repeat indefinitely."
                error={errors.end_date?.message}
                {...register('end_date')}
              />
              <p className="text-xs text-gray-400">
                A transaction is created automatically each period, starting on the date above.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-4 sm:pt-3 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 touch-manipulation">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1 touch-manipulation">
          {initialData ? 'Save Changes' : isRecurring ? 'Schedule' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}
