import { useState } from 'react';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';
import CategoryList from '@/components/categories/CategoryList';
import CategoryForm from '@/components/categories/CategoryForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize your transactions with categories</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType(undefined)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterType === undefined
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterType === 'expense'
              ? 'bg-red-100 text-red-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Expense
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterType === 'income'
              ? 'bg-green-100 text-green-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Income
        </button>
      </div>

      {isLoading ? (
        <Spinner size={32} />
      ) : !categories || categories.length === 0 ? (
        <EmptyState
          icon={<Tag size={48} />}
          title="No categories found"
          description="Create categories to organize your transactions"
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add Category
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
    </div>
  );
}

