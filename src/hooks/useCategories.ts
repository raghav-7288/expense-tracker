import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getMergedCategories,
  createUserCategory,
  updateUserCategory,
  deleteUserCategory,
  hideSystemCategory,
  restoreSystemCategory,
  copySystemCategory,
  getHiddenSystemCategories,
} from '@/services/categories';
import type { MergedCategory, CreateCategoryInput, UpdateCategoryInput, TransactionType } from '@/types';
import toast from 'react-hot-toast';

/**
 * A Postgres unique-violation (SQLSTATE 23505). After migration 012 the
 * user_categories uniqueness index only covers LIVE rows, so this can only
 * mean a non-deleted category with the same name+type already exists —
 * re-creating the name of a soft-deleted category no longer conflicts.
 */
function isDuplicateCategory(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  return e.code === '23505' || /duplicate key|already exists/i.test(e.message ?? '');
}


export function useCategories(type?: TransactionType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.categories.list(user?.id, type),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getMergedCategories(user.id, type);
      if (error) throw new Error(typeof error === 'string' ? error : (error as Error).message ?? 'Failed to load categories');
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useHiddenCategories() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.categories.hidden(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getHiddenSystemCategories(user.id);
      if (error) throw new Error(typeof error === 'string' ? error : (error as Error).message ?? 'Failed to load hidden categories');
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
      const { data, error } = await createUserCategory({ ...input, user_id: user.id });
      if (error) {
        // A live category with this name+type already exists. Treat it as a
        // benign, informative outcome — a friendly toast, not a hard failure.
        if (isDuplicateCategory(error)) {
          toast(`A category named “${input.name.trim()}” already exists.`, { icon: '⚠️' });
          return null;
        }
        throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to create category');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      // `data` is null when the create was a no-op (duplicate) — already toasted.
      if (data) toast.success('Category created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCategoryInput }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await updateUserCategory(id, user.id, input);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to update category');
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await deleteUserCategory(id, user.id);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to delete category');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const previousQueries = queryClient.getQueriesData<MergedCategory[]>({
        queryKey: queryKeys.categories.all,
      });

      queryClient.setQueriesData<MergedCategory[]>(
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

export function useHideCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await hideSystemCategory(user.id, categoryId);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to hide category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category hidden');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to hide category');
    },
  });
}

export function useRestoreCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await restoreSystemCategory(user.id, categoryId);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to restore category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category restored');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to restore category');
    },
  });
}

export function useCopyCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await copySystemCategory(user.id, categoryId);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to copy category');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast.success('Category copied — you can now edit it');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to copy category');
    },
  });
}
