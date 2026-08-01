import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  recordRepayment,
  getLoanTransactions,
  getLoanSummary,
} from '@/services/loans';
import type {
  Loan,
  CreateLoanInput,
  UpdateLoanInput,
  RecordRepaymentInput,
  LoanFilters,
} from '@/types';
import toast from 'react-hot-toast';

/** Invalidate all queries affected by loan changes. */
function invalidateLoanRelated(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
}

export function useLoans(filters?: LoanFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.loans.list(user?.id, filters),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getLoans(user.id, filters);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to load loans');
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: queryKeys.loans.detail(id),
    queryFn: async () => {
      const { data, error } = await getLoan(id);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to load loan');
      return data;
    },
    enabled: !!id,
  });
}

export function useLoanTransactions(loanId: string) {
  return useQuery({
    queryKey: queryKeys.loans.transactions(loanId),
    queryFn: async () => {
      const { data, error } = await getLoanTransactions(loanId);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to load loan history');
      return data ?? [];
    },
    enabled: !!loanId,
  });
}

export function useLoanSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.loans.summary(user?.id),
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await getLoanSummary(user.id);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to load loan summary');
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<CreateLoanInput, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await createLoan({ ...input, user_id: user.id });
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to create loan');
      return data;
    },
    onSuccess: (_data, variables) => {
      invalidateLoanRelated(queryClient);
      const verb = variables.type === 'lent' ? 'Lent' : 'Borrowed';
      toast.success(`${verb} money recorded`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create loan');
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLoanInput }) => {
      const { data, error } = await updateLoan(id, input);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to update loan');
      return data;
    },
    onSuccess: () => {
      invalidateLoanRelated(queryClient);
      toast.success('Loan updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update loan');
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteLoan(id);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to delete loan');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.loans.all });
      const previousQueries = queryClient.getQueriesData<Loan[]>({
        queryKey: queryKeys.loans.all,
      });

      queryClient.setQueriesData<Loan[]>(
        { queryKey: queryKeys.loans.all },
        (old) => old?.filter((l) => l.id !== id),
      );

      return { previousQueries };
    },
    onError: (_error, _id, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error('Failed to delete loan');
    },
    onSettled: () => {
      invalidateLoanRelated(queryClient);
    },
    onSuccess: () => {
      toast.success('Loan deleted');
    },
  });
}

export function useRecordRepayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordRepaymentInput) => {
      const { data, error } = await recordRepayment(input);
      if (error) throw new Error(typeof error === 'object' && 'message' in error ? (error as { message: string }).message : 'Failed to record repayment');
      return data;
    },
    onSuccess: () => {
      invalidateLoanRelated(queryClient);
      toast.success('Repayment recorded');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record repayment');
    },
  });
}

