import { useState } from 'react';
import {
  useUpdateCategory,
  useDeleteCategory,
  useHideCategory,
  useCopyCategory,
} from '@/hooks/useCategories';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import CategoryForm from '@/components/categories/CategoryForm';
import { Edit, Trash2, EyeOff, Copy, Lock, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MergedCategory } from '@/types';

interface CategoryListProps {
  categories: MergedCategory[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<MergedCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MergedCategory | null>(null);
  const [hidingCategory, setHidingCategory] = useState<MergedCategory | null>(null);

  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const hideMutation = useHideCategory();
  const copyMutation = useCopyCategory();

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

  async function handleDelete() {
    if (!deletingCategory) return;
    await deleteMutation.mutateAsync(deletingCategory.id);
    setDeletingCategory(null);
  }

  async function handleHide() {
    if (!hidingCategory) return;
    await hideMutation.mutateAsync(hidingCategory.id);
    setHidingCategory(null);
  }

  async function handleCopy(category: MergedCategory) {
    await copyMutation.mutateAsync(category.id);
  }

  const systemCategories = categories.filter((c) => c.source === 'system');
  const customCategories = categories.filter((c) => c.source === 'user');

  return (
    <>
      {/* System Categories Section */}
      {systemCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-gray-400" aria-hidden="true" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Default Categories
            </h3>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              Read-only
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemCategories.map((category) => (
              <div
                key={category.id}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 transition-all duration-150 hover:shadow-md hover:border-gray-300"
              >
                <Avatar name={category.name} color={category.color} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                    <Lock size={10} className="text-gray-300 flex-shrink-0" aria-hidden="true" />
                  </div>
                  <Badge type={category.type} />
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(category)}
                    disabled={copyMutation.isPending}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                    aria-label={`Copy ${category.name}`}
                    title="Copy as custom"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => setHidingCategory(category)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                    aria-label={`Hide ${category.name}`}
                    title="Hide"
                  >
                    <EyeOff size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Categories Section */}
      {customCategories.length > 0 && (
        <div className={cn('space-y-3', systemCategories.length > 0 && 'mt-6')}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Custom Categories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customCategories.map((category) => (
              <div
                key={category.id}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 transition-all duration-150 hover:shadow-md hover:border-gray-300"
              >
                <Avatar name={category.name} color={category.color} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                  <Badge type={category.type} />
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(category)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${category.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal (only for custom categories) */}
      <Modal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
      >
        {editingCategory && (
          <CategoryForm
            initialData={{
              id: editingCategory.id,
              user_id: '',
              name: editingCategory.name,
              type: editingCategory.type,
              color: editingCategory.color,
              icon: editingCategory.icon,
              created_at: '',
              updated_at: '',
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditingCategory(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Delete Category"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{deletingCategory?.name}</strong>? Transactions using this category will become uncategorized.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeletingCategory(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={handleDelete}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* Hide Confirmation */}
      <Modal
        open={!!hidingCategory}
        onClose={() => setHidingCategory(null)}
        title="Hide Category"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Hide <strong>{hidingCategory?.name}</strong> from your list? You can restore it anytime from the &ldquo;Hidden&rdquo; filter.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setHidingCategory(null)} className="flex-1">
            Cancel
          </Button>
          <Button
            loading={hideMutation.isPending}
            onClick={handleHide}
            className="flex-1"
          >
            Hide
          </Button>
        </div>
      </Modal>
    </>
  );
}
