import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/utils/cn';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/utils/constants';
import { Tag } from 'lucide-react';
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Input
        label="Name"
        placeholder="e.g. Groceries, Salary"
        leftIcon={<Tag size={15} />}
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

      <div className="space-y-2">
        <label id="color-label" className="block text-sm font-medium text-gray-700">Color</label>
        <div className="grid grid-cols-8 gap-2" role="radiogroup" aria-labelledby="color-label">
          {CATEGORY_COLORS.map((color, index) => (
            <button
              key={color}
              type="button"
              role="radio"
              className={cn(
                'w-8 h-8 rounded-full transition-all duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                selectedColor === color
                  ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                  : 'hover:scale-110',
              )}
              style={{ backgroundColor: color }}
              onClick={() => setValue('color', color)}
              aria-label={`Color ${index + 1}`}
              aria-checked={selectedColor === color}
            />
          ))}
        </div>
        {errors.color && (
          <p className="text-xs text-red-600 flex items-center gap-1" role="alert">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <circle cx="6" cy="6" r="6" fill="currentColor" opacity="0.15" />
              <path d="M6 3.5V6.5M6 8.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {errors.color.message}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-3 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
