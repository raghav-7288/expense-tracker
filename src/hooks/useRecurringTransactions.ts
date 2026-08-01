import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  generateDueTransactions,
} from '@/services/recurring';
import type {
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
} from '@/types';
import toast from 'react-hot-toast';

function errorMessage(error: unknown, fallback: string): string {
  return typeof error === 'object' && error !== null && 'message' in error
    ? (error as { message: string }).message
    : fallback;
}

/** Invalidate everything a recurring change can touch (rules + generated transactions). */
function invalidateRecurringRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
  queryClient.invalidateQueries({ queryKey: ['analytics'] as const });
}

export function useRecurringTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.recurringTransactions.list(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getRecurringTransactions(user.id);
      if (error) throw new Error(errorMessage(error, 'Failed to load recurring transactions'));
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<CreateRecurringTransactionInput, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await createRecurringTransaction({ ...input, user_id: user.id });
      if (error) throw new Error(errorMessage(error, 'Failed to create recurring transaction'));
      // Immediately materialize any occurrence that is already due (e.g. today).
      await generateDueTransactions(user.id);
      return data;
    },
    onSuccess: () => {
      invalidateRecurringRelated(queryClient);
      toast.success('Recurring transaction scheduled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to schedule recurring transaction');
    },
  });
}

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRecurringTransactionInput }) => {
      const { data, error } = await updateRecurringTransaction(id, input);
      if (error) throw new Error(errorMessage(error, 'Failed to update recurring transaction'));
      return data;
    },
    onSuccess: () => {
      invalidateRecurringRelated(queryClient);
      toast.success('Recurring transaction updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update recurring transaction');
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteRecurringTransaction(id);
      if (error) throw new Error(errorMessage(error, 'Failed to delete recurring transaction'));
    },
    onMutate: async (id) => {
      // Optimistic: remove from the recurring list immediately.
      await queryClient.cancelQueries({ queryKey: queryKeys.recurringTransactions.all });
      const previousQueries = queryClient.getQueriesData<RecurringTransaction[]>({
        queryKey: queryKeys.recurringTransactions.all,
      });

      queryClient.setQueriesData<RecurringTransaction[]>(
        { queryKey: queryKeys.recurringTransactions.all },
        (old) => old?.filter((r) => r.id !== id),
      );

      return { previousQueries };
    },
    onError: (_error, _id, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error('Failed to delete recurring transaction');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringTransactions.all });
    },
    onSuccess: () => {
      toast.success('Recurring transaction deleted');
    },
  });
}

/**
 * Runs once when the app shell mounts: generates any transactions that have
 * become due since the user last used the app. Silent unless something is
 * generated, in which case affected queries are refreshed and a toast is shown.
 */
export function useGenerateDueTransactions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const ranForUser = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // Guard against React 18 double-invoke / re-renders generating twice.
    if (ranForUser.current === user.id) return;
    ranForUser.current = user.id;

    let cancelled = false;
    void (async () => {
      try {
        const { generated, error } = await generateDueTransactions(user.id);
        if (cancelled || error || generated === 0) return;
        invalidateRecurringRelated(queryClient);
        toast.success(
          `${String(generated)} recurring ${generated === 1 ? 'transaction' : 'transactions'} added`,
        );
      } catch {
        // Non-critical background task — never surface a crash to the user.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, queryClient]);
}

