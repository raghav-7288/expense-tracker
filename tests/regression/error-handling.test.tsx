/**
 * Regression tests for error handling patterns in hooks.
 * Verifies that service errors are properly wrapped in Error objects.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import type { ReactNode } from 'react';

// Mock services
vi.mock('@/services/transactions', () => ({
  getTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}));

vi.mock('@/services/accounts', () => ({
  getActiveAccounts: vi.fn(),
  getAllAccountBalances: vi.fn(),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));

import { getTransactions } from '@/services/transactions';
import { getActiveAccounts } from '@/services/accounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '',
} as never;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const authValue: AuthContextType = {
    user: mockUser,
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  };

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe('Hook Error Handling Regression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useTransactions throws Error with message from PostgrestError', async () => {
    const mockError = { message: 'Permission denied', code: '42501', details: '', hint: '' } as never;
    vi.mocked(getTransactions).mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Permission denied');
  });

  it('useAccounts throws Error with message from unknown error shape', async () => {
    const mockError = { message: 'Connection timeout' } as never;
    vi.mocked(getActiveAccounts).mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Connection timeout');
  });

  it('useAccounts provides fallback message when error has no message', async () => {
    const mockError = { code: 'UNKNOWN' } as never;
    vi.mocked(getActiveAccounts).mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(() => useAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to load accounts');
  });

  it('useTransactions returns empty array when user is null', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const authValue: AuthContextType = {
      user: null,
      session: null,
      loading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    };

    function NullUserWrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={authValue}>
            {children}
          </AuthContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useTransactions(), {
      wrapper: NullUserWrapper,
    });

    // Query should be disabled when no user
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

