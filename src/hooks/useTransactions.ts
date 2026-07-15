import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactions';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionFilters } from '@/types';
import toast from 'react-hot-toast';

export function useTransactions(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.transactions.list(user?.id, filters),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getTransactions(user.id, filters);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<CreateTransactionInput, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await createTransaction({ ...input, user_id: user.id });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Transaction created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create transaction');
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateTransactionInput }) => {
      const { data, error } = await updateTransaction(id, input);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Transaction updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update transaction');
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteTransaction(id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id) => {
      // Optimistic: remove from all transaction caches immediately
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });
      const previousQueries = queryClient.getQueriesData<Transaction[]>({
        queryKey: queryKeys.transactions.all,
      });

      queryClient.setQueriesData<Transaction[]>(
        { queryKey: queryKeys.transactions.all },
        (old) => old?.filter((t) => t.id !== id),
      );

      return { previousQueries };
    },
    onError: (_error, _id, context) => {
      // Rollback on failure
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error('Failed to delete transaction');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onSuccess: () => {
      toast.success('Transaction deleted');
    },
  });
}
