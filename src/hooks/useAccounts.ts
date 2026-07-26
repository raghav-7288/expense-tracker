import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import {
  getActiveAccounts,
  getAllAccountBalances,
  createAccount,
  updateAccount,
  deleteAccount,
} from '@/services/accounts';
import type { CreateAccountInput, UpdateAccountInput } from '@/types';
import toast from 'react-hot-toast';

export function useAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.accounts.list(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getActiveAccounts(user.id);
      if (error) throw new Error(typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : 'Failed to load accounts');
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useAccountBalances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.accounts.balances(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await getAllAccountBalances(user.id);
      if (error) throw new Error('Failed to load account balances');
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds — balances update on transaction changes
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: Omit<CreateAccountInput, 'user_id'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await createAccount({ ...input, user_id: user.id });
      if (error) throw new Error(typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : 'Failed to create account');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Account created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account');
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAccountInput }) => {
      const { data, error } = await updateAccount(id, input);
      if (error) throw new Error(typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : 'Failed to update account');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      toast.success('Account updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update account');
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteAccount(id);
      if (error) throw new Error(typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : 'Failed to delete account');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      toast.success('Account deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });
}
