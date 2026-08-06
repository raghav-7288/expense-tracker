import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import Button from '@/components/ui/Button';
import type { Budget, CreateBudgetInput, UpdateBudgetInput, BudgetPeriod, CategorySource } from '@/types';

interface BudgetFormProps {
  budget?: Budget | null;
  onSubmit: (input: Omit<CreateBudgetInput, 'user_id'> | UpdateBudgetInput) => void;
  loading?: boolean;
}

export default function BudgetForm({ budget, onSubmit, loading = false }: BudgetFormProps) {
  const { data: categories } = useCategories('expense');
  const isEditing = !!budget;

  const [categoryId, setCategoryId] = useState(budget?.category_id ?? '');
  const [categorySource, setCategorySource] = useState<CategorySource>(budget?.category_source ?? 'system');
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '');
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? 'monthly');
  const [alertThreshold, setAlertThreshold] = useState(
    ((budget?.alert_threshold ?? 0.8) * 100).toString(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    // Determine source from the categories list
    const cat = categories?.find((c) => c.id === value);
    if (cat) {
      setCategorySource(cat.source);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!isEditing && !categoryId) {
      newErrors.category = 'Please select a category';
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    const parsedThreshold = parseFloat(alertThreshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 1 || parsedThreshold > 100) {
      newErrors.threshold = 'Threshold must be between 1 and 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    if (isEditing) {
      const input: UpdateBudgetInput = {
        amount: parsedAmount,
        period,
        alert_threshold: parsedThreshold / 100,
      };
      onSubmit(input);
    } else {
      const input: Omit<CreateBudgetInput, 'user_id'> = {
        category_id: categoryId,
        category_source: categorySource,
        amount: parsedAmount,
        period,
        alert_threshold: parsedThreshold / 100,
      };
      onSubmit(input);
    }
  }

  // useCategories('expense') already filters by type — no additional client filter needed
  const expenseCategories = categories ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category */}
      {!isEditing ? (
        <div>
          <label htmlFor="budget-category" className="block text-xs font-medium text-gray-700 mb-1.5">
            Category
          </label>
          <select
            id="budget-category"
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          >
            <option value="">Select a category...</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-red-500 mt-1">{errors.category}</p>
          )}
        </div>
      ) : (
        <div>
          <span className="block text-xs font-medium text-gray-700 mb-1.5">Category</span>
          <p className="text-sm text-gray-900 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
            {budget?.category?.name ?? categories?.find((c) => c.id === budget?.category_id)?.name ?? 'Unknown'}
          </p>
        </div>
      )}

      {/* Amount */}
      <div>
        <label htmlFor="budget-amount" className="block text-xs font-medium text-gray-700 mb-1.5">
          Budget Amount
        </label>
        <input
          id="budget-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 500"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
        />
        {errors.amount && (
          <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
        )}
      </div>

      {/* Period */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Period
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              period === 'monthly'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod('weekly')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              period === 'weekly'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Alert Threshold */}
      <div>
        <label htmlFor="budget-threshold" className="block text-xs font-medium text-gray-700 mb-1.5">
          Alert at ({alertThreshold}%)
        </label>
        <input
          id="budget-threshold"
          type="range"
          min="50"
          max="100"
          step="5"
          value={alertThreshold}
          onChange={(e) => setAlertThreshold(e.target.value)}
          aria-valuetext={`Alert when spending reaches ${alertThreshold}% of budget`}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>50%</span>
          <span>100%</span>
        </div>
        {errors.threshold && (
          <p className="text-xs text-red-500 mt-1">{errors.threshold}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" size="sm" loading={loading}>
          {isEditing ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
}

