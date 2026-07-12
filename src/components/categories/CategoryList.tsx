import { useState } from 'react';
import { useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CategoryForm from '@/components/categories/CategoryForm';
import { Edit, Trash2 } from 'lucide-react';
import type { Category } from '@/types';

interface CategoryListProps {
  categories: Category[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  async function handleUpdate(data: Record<string, unknown>) {
    if (!editingCategory) return;
    await updateMutation.mutateAsync({
      id: editingCategory.id,
      input: {
        name: data.name as string,
        color: data.color as string,
        icon: data.icon as string,
      },
    });
    setEditingCategory(null);
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: category.color }}
            >
              <span className="text-white text-sm font-bold">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
              <Badge type={category.type} />
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setEditingCategory(category)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                aria-label={`Edit ${category.name}`}
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => setDeletingId(category.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                aria-label={`Delete ${category.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
      >
        {editingCategory && (
          <CategoryForm
            initialData={editingCategory}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCategory(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Delete Category"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this category? Transactions using this category will become uncategorized.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeletingId(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deletingId && handleDelete(deletingId)}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

