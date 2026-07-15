import { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useHiddenCategories,
  useRestoreCategory,
} from '@/hooks/useCategories';
import CategoryList from '@/components/categories/CategoryList';
import CategoryForm from '@/components/categories/CategoryForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { SkeletonCategoryGrid } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import { Plus, Tag, RotateCcw } from 'lucide-react';
import type { TransactionType, CategoryFilter } from '@/types';

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<CategoryFilter>('all');

  // Determine query type based on filter
  const queryType: TransactionType | undefined =
    filterType === 'expense' || filterType === 'income' ? filterType : undefined;

  const { data: categories, isLoading } = useCategories(queryType);
  const { data: hiddenCategories, isLoading: hiddenLoading } = useHiddenCategories();
  const createMutation = useCreateCategory();
  const restoreMutation = useRestoreCategory();

  async function handleCreate(data: Record<string, unknown>) {
    await createMutation.mutateAsync({
      name: data.name as string,
      type: data.type as TransactionType,
      color: data.color as string,
      icon: data.icon as string,
    });
    setShowForm(false);
  }

  async function handleRestore(categoryId: string) {
    await restoreMutation.mutateAsync(categoryId);
  }

  // Apply client-side filtering for custom/default
  const filteredCategories = (categories ?? []).filter((c) => {
    if (filterType === 'custom') return c.source === 'user';
    if (filterType === 'default') return c.source === 'system';
    return true;
  });

  const filters: { value: CategoryFilter; label: string; activeClass: string }[] = [
    { value: 'all', label: 'All', activeClass: 'bg-primary-100 text-primary-700' },
    { value: 'expense', label: 'Expense', activeClass: 'bg-red-50 text-red-700' },
    { value: 'income', label: 'Income', activeClass: 'bg-green-50 text-green-700' },
    { value: 'default', label: 'Default', activeClass: 'bg-blue-50 text-blue-700' },
    { value: 'custom', label: 'Custom', activeClass: 'bg-purple-50 text-purple-700' },
  ];

  const showHiddenSection = filterType === 'all' || filterType === 'default';

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your transactions with categories. Default categories are shared and read-only — create custom ones for full control."
        action={
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus size={16} />
            Add Custom Category
          </Button>
        }
      />

      {/* Type filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterType(filter.value)}
            aria-pressed={filterType === filter.value}
            className={cn(
              'px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterType === filter.value
                ? filter.activeClass
                : 'text-gray-500 hover:bg-gray-100',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonCategoryGrid />
      ) : !filteredCategories || filteredCategories.length === 0 ? (
        <EmptyState
          icon={<Tag size={28} />}
          title={filterType === 'custom' ? 'No custom categories yet' : 'No categories found'}
          description={
            filterType === 'custom'
              ? 'Create your own categories to organize transactions your way.'
              : 'Create custom categories like Food, Transport, or Entertainment to keep your transactions neatly organized.'
          }
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create Custom Category
            </Button>
          }
        />
      ) : (
        <CategoryList categories={filteredCategories} />
      )}

      {/* Hidden Categories Section */}
      {showHiddenSection && hiddenCategories && hiddenCategories.length > 0 && (
        <div className="space-y-3 mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Hidden Categories ({hiddenCategories.length})
          </h3>
          <p className="text-xs text-gray-400">
            These default categories are hidden from your list. Restore them to make them visible again.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hiddenCategories.map((category) => (
              <div
                key={category.id}
                className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity"
              >
                <Avatar name={category.name} color={category.color} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 truncate">{category.name}</p>
                  <Badge type={category.type} />
                </div>
                <button
                  onClick={() => handleRestore(category.id)}
                  disabled={restoreMutation.isPending}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                  aria-label={`Restore ${category.name}`}
                  title="Restore"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden categories loading state */}
      {showHiddenSection && hiddenLoading && (
        <div className="text-xs text-gray-400 mt-4">Loading hidden categories...</div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Custom Category">
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </AnimatedPage>
  );
}
