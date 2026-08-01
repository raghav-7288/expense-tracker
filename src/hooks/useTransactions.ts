import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  updateLoanTransaction,
  deleteLoanTransaction,
} from '@/services/transactions';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionFilters, LoanEventType } from '@/types';
import toast from 'react-hot-toast';

/** Invalidate all queries affected by transaction changes. */
function invalidateTransactionRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
  // Loan-linked transactions (disbursements/repayments) surface on the Loans
  // page and in the Loan Summary card, so any transaction change must refresh
  // loan views too — otherwise the loans page shows stale data.
  queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
  queryClient.invalidateQueries({ queryKey: ['analytics'] as const });
}

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
      invalidateTransactionRelated(queryClient);
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
      invalidateTransactionRelated(queryClient);
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
      invalidateTransactionRelated(queryClient);
    },
    onSuccess: () => {
      toast.success('Transaction deleted');
    },
  });
}

/**
 * Update a loan-linked transaction (repayment or disbursement) with
 * automatic sync of the parent loan's outstanding_amount and status.
 */
export function useUpdateLoanTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input, loanId }: { id: string; input: UpdateTransactionInput; loanId: string }) => {
      const { data, error } = await updateLoanTransaction(id, input, loanId);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to update transaction');
      return data;
    },
    onSuccess: () => {
      invalidateTransactionRelated(queryClient);
      toast.success('Transaction updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update transaction');
    },
  });
}

/**
 * Delete a loan-linked transaction with automatic loan sync.
 * For disbursements: deletes the entire loan and all its transactions.
 * For repayments: deletes the repayment and recalculates the loan.
 */
export function useDeleteLoanTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, loanId, eventType }: { id: string; loanId: string; eventType: LoanEventType }) => {
      const { error } = await deleteLoanTransaction(id, loanId, eventType);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to delete transaction');
    },
    onMutate: async ({ id }) => {
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
    onError: (_error, _vars, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error('Failed to delete transaction');
    },
    onSettled: () => {
      invalidateTransactionRelated(queryClient);
    },
    onSuccess: (_data, variables) => {
      if (variables.eventType === 'disbursement') {
        toast.success('Loan and all linked transactions deleted');
      } else {
        toast.success('Repayment deleted — loan updated');
      }
    },
  });
}

