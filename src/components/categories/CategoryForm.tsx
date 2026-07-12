import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/utils/constants';
import type { Category } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().min(1, 'Icon is required'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name ?? '',
      type: initialData?.type ?? 'expense',
      color: initialData?.color ?? CATEGORY_COLORS[0],
      icon: initialData?.icon ?? CATEGORY_ICONS[0],
    },
  });

  const selectedColor = watch('color');

  const typeOptions = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
  ];

  const iconOptions = CATEGORY_ICONS.map((icon) => ({
    value: icon,
    label: icon.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        placeholder="e.g. Groceries"
        error={errors.name?.message}
        {...register('name')}
      />

      {!initialData && (
        <Select
          label="Type"
          options={typeOptions}
          error={errors.type?.message}
          {...register('type')}
        />
      )}

      <Select
        label="Icon"
        options={iconOptions}
        error={errors.icon?.message}
        {...register('icon')}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <div className="grid grid-cols-8 gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                selectedColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setValue('color', color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        {errors.color && <p className="text-sm text-red-600">{errors.color.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'Update' : 'Create'} Category
        </Button>
      </div>
    </form>
  );
}

