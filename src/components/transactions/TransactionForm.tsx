import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/hooks/useCurrency';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import { getToday } from '@/utils/formatDate';
import { FileText, Calendar, IndianRupee, DollarSign, Euro, PoundSterling, JapaneseYen } from 'lucide-react';
import type { Transaction, TransactionType } from '@/types';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(200),
  category_id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(500).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

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
}: TransactionFormProps) {
  const currency = useCurrency();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: {
      type: initialData?.type ?? 'expense',
      amount: initialData ? Number(initialData.amount) : undefined,
      description: initialData?.description ?? '',
      category_id: initialData?.category_id ?? '',
      date: initialData?.date ?? getToday(),
      notes: initialData?.notes ?? '',
    },
  });

  const selectedType = watch('type') as TransactionType;
  const { data: categories } = useCategories(selectedType);

  const categoryOptions = (categories ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-5">
      {/* Type toggle */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Transaction type</legend>
        <div className="txn-type-group grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-gray-100">
          <label className="relative cursor-pointer">
            <input type="radio" value="expense" {...register('type')} className="peer sr-only" />
            <div className="txn-type-option txn-type-expense rounded-lg py-2.5 text-center text-sm font-bold transition-all peer-checked:bg-rose-500 peer-checked:text-white peer-checked:shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500/40">
              Expense
            </div>
          </label>
          <label className="relative cursor-pointer">
            <input type="radio" value="income" {...register('type')} className="peer sr-only" />
            <div className="txn-type-option txn-type-income rounded-lg py-2.5 text-center text-sm font-bold transition-all peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:shadow-md peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40">
              Income
            </div>
          </label>
        </div>
      </fieldset>

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
        label="Description"
        placeholder="e.g. Grocery shopping at Trader Joe's"
        leftIcon={<FileText size={15} />}
        error={errors.description?.message}
        {...register('description')}
      />

      <Select
        label="Category"
        options={categoryOptions}
        placeholder="Select a category"
        error={errors.category_id?.message}
        {...register('category_id')}
      />

      <Input
        label="Date"
        type="date"
        leftIcon={<Calendar size={15} />}
        error={errors.date?.message}
        {...register('date')}
      />

      <TextArea
        label="Notes"
        placeholder="Add any additional details..."
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'Save Changes' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
}
