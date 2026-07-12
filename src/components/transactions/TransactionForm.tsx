import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories } from '@/hooks/useCategories';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import { getToday } from '@/utils/formatDate';
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

export default function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: TransactionFormProps) {
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
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="relative">
          <input type="radio" value="expense" {...register('type')} className="peer sr-only" />
          <div className="peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 border border-gray-300 rounded-lg py-2.5 text-center text-sm font-medium cursor-pointer transition-colors hover:bg-gray-50">
            Expense
          </div>
        </label>
        <label className="relative">
          <input type="radio" value="income" {...register('type')} className="peer sr-only" />
          <div className="peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 border border-gray-300 rounded-lg py-2.5 text-center text-sm font-medium cursor-pointer transition-colors hover:bg-gray-50">
            Income
          </div>
        </label>
      </div>

      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <Input
        label="Description"
        placeholder="e.g. Grocery shopping"
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
        error={errors.date?.message}
        {...register('date')}
      />

      <TextArea
        label="Notes (optional)"
        placeholder="Additional details..."
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'Update' : 'Add'} Transaction
        </Button>
      </div>
    </form>
  );
}




