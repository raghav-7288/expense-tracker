import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { Account } from '@/types';

const ACCOUNT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['checking', 'savings', 'credit_card', 'cash', 'investment', 'other']),
  initial_balance: z.coerce.number(),
  color: z.string().min(1),
  icon: z.string().min(1),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  initialData?: Account;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function AccountForm({ initialData, onSubmit, onCancel, loading = false }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema) as never,
    defaultValues: {
      name: initialData?.name ?? '',
      type: initialData?.type ?? 'checking',
      initial_balance: initialData ? Number(initialData.initial_balance) : 0,
      color: initialData?.color ?? '#3b82f6',
      icon: initialData?.icon ?? 'wallet',
    },
  });

  const selectedColor = watch('color');

  const typeOptions = [
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'Savings' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'investment', label: 'Investment' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4 sm:space-y-5">
      <Input
        label="Account Name"
        placeholder="e.g. HDFC Savings"
        error={errors.name?.message}
        {...register('name')}
      />

      <Select
        label="Account Type"
        options={typeOptions}
        error={errors.type?.message}
        {...register('type')}
      />

      <Input
        label="Current Balance"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.initial_balance?.message}
        {...register('initial_balance')}
      />

      {/* Color picker */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-full border-2 transition-all touch-manipulation ${
                selectedColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      <input type="hidden" {...register('icon')} />

      <div className="flex gap-3 pt-4 sm:pt-3 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1 touch-manipulation">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1 touch-manipulation">
          {initialData ? 'Save Changes' : 'Add Account'}
        </Button>
      </div>
    </form>
  );
}
