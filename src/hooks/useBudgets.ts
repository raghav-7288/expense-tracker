import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getBudgets,
  getBudgetProgress,
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/services/budgets';
import type { CreateBudgetInput, UpdateBudgetInput } from '@/types';
import toast from 'react-hot-toast';

export function useBudgets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.budgets.list(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getBudgets(user.id);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to load budgets');
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useBudgetProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.budgets.progress(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getBudgetProgress(user.id);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to load budget progress');
      return data ?? [];
    },
    enabled: !!user,
    // Refetch every 5 minutes to keep budget status up to date
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<CreateBudgetInput, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await createBudget({ ...input, user_id: user.id });
      if (error) {
        const msg = typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to create budget';
        // Handle unique constraint violation
        if (msg.includes('duplicate') || msg.includes('already exists') || (error as { code?: string }).code === '23505') {
          throw new Error('A budget for this category and period already exists');
        }
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      toast.success('Budget created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create budget');
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBudgetInput }) => {
      const { data, error } = await updateBudget(id, input);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to update budget');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      toast.success('Budget updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update budget');
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteBudget(id);
      if (error) throw new Error(typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Failed to delete budget');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
      toast.success('Budget deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete budget');
    },
  });
}

