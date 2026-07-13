import { useState } from 'react';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import CategoryList from '@/components/categories/CategoryList';
import CategoryForm from '@/components/categories/CategoryForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import { SkeletonCategoryGrid } from '@/components/ui/Skeleton';
import { cn } from '@/utils/cn';
import { Plus, Tag } from 'lucide-react';
import type { TransactionType } from '@/types';

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<TransactionType | undefined>(undefined);

  const { data: categories, isLoading } = useCategories(filterType);
  const createMutation = useCreateCategory();

  async function handleCreate(data: Record<string, unknown>) {
    await createMutation.mutateAsync({
      name: data.name as string,
      type: data.type as TransactionType,
      color: data.color as string,
      icon: data.icon as string,
    });
    setShowForm(false);
  }

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your transactions with categories"
        action={
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus size={16} />
            Add Category
          </Button>
        }
      />

      {/* Type filter */}
      <div className="flex gap-2" role="group" aria-label="Filter by type">
        {([
          { value: undefined, label: 'All', activeClass: 'bg-primary-100 text-primary-700' },
          { value: 'expense' as const, label: 'Expense', activeClass: 'bg-red-50 text-red-700' },
          { value: 'income' as const, label: 'Income', activeClass: 'bg-green-50 text-green-700' },
        ] as const).map((filter) => (
          <button
            key={filter.label}
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
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={<Tag size={28} />}
          title="Organize with categories"
          description="Create custom categories like Food, Transport, or Entertainment to keep your transactions neatly organized."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Create Your First Category
            </Button>
          }
        />
      ) : (
        <CategoryList categories={categories} />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Category">
        <CategoryForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </AnimatedPage>
  );
}

