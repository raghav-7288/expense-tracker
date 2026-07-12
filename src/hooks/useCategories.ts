import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categories';
import type { Category, CreateCategoryInput, UpdateCategoryInput, TransactionType } from '@/types';
import toast from 'react-hot-toast';

export function useCategories(type?: TransactionType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.categories.list(user?.id, type),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getCategories(user.id, type);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<CreateCategoryInput, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await createCategory({ ...input, user_id: user.id });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCategoryInput }) => {
      const { data, error } = await updateCategory(id, input);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteCategory(id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const previousQueries = queryClient.getQueriesData<Category[]>({
        queryKey: queryKeys.categories.all,
      });

      queryClient.setQueriesData<Category[]>(
        { queryKey: queryKeys.categories.all },
        (old) => old?.filter((c) => c.id !== id),
      );

      return { previousQueries };
    },
    onError: (_error, _id, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error('Failed to delete category');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    onSuccess: () => {
      toast.success('Category deleted');
    },
  });
}
