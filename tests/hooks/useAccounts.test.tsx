/**
 * Tests for useAccounts hook — covers mutations (create, update, delete)
 * that were previously untested (21% → target 80%+).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import {
  useAccounts,
  useAccountBalances,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/useAccounts';
import type { ReactNode } from 'react';

const mockGetActiveAccounts = vi.fn();
const mockGetAllAccountBalances = vi.fn();
const mockCreateAccount = vi.fn();
const mockUpdateAccount = vi.fn();
const mockDeleteAccount = vi.fn();

vi.mock('@/services/accounts', () => ({
  getActiveAccounts: (...args: unknown[]) => mockGetActiveAccounts(...args),
  getAllAccountBalances: (...args: unknown[]) => mockGetAllAccountBalances(...args),
  createAccount: (...args: unknown[]) => mockCreateAccount(...args),
  updateAccount: (...args: unknown[]) => mockUpdateAccount(...args),
  deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  const authValue = createMockAuth();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
          <AuthContext.Provider value={authValue}>
            {children}
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    );
  };
}

describe('useAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches active accounts successfully', async () => {
    const accounts = [
      { id: '1', name: 'Checking', type: 'checking', initial_balance: 1000 },
      { id: '2', name: 'Savings', type: 'savings', initial_balance: 5000 },
    ];
    mockGetActiveAccounts.mockResolvedValue({ data: accounts, error: null });

    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.name).toBe('Checking');
  });

  it('returns empty array when no accounts', async () => {
    mockGetActiveAccounts.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on error', async () => {
    mockGetActiveAccounts.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useAccountBalances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches account balances', async () => {
    const balances = [
      { account: { id: '1', name: 'Checking' }, balance: 1500 },
    ];
    mockGetAllAccountBalances.mockResolvedValue({ data: balances, error: null });

    const { result } = renderHook(() => useAccountBalances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.balance).toBe(1500);
  });

  it('returns empty array on error', async () => {
    mockGetAllAccountBalances.mockResolvedValue({ data: null, error: 'fail' });
    const { result } = renderHook(() => useAccountBalances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates account successfully', async () => {
    const newAccount = { id: '3', name: 'Cash', type: 'cash', initial_balance: 0 };
    mockCreateAccount.mockResolvedValue({ data: newAccount, error: null });

    const { result } = renderHook(() => useCreateAccount(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Cash', type: 'cash', initial_balance: 0 });
    });

    expect(mockCreateAccount).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Cash', user_id: 'user-123' }),
    );
  });

  it('throws when not authenticated', async () => {
    const queryClient = createTestQueryClient();
    const authValue = createMockAuth({ user: null });

    function NullWrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
            <AuthContext.Provider value={authValue}>
              {children}
            </AuthContext.Provider>
          </ThemeContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useCreateAccount(), { wrapper: NullWrapper });

    await expect(
      act(() => result.current.mutateAsync({ name: 'X', type: 'cash', initial_balance: 0 })),
    ).rejects.toThrow('Not authenticated');
  });

  it('shows error toast on failure', async () => {
    mockCreateAccount.mockResolvedValue({ data: null, error: { message: 'Duplicate name' } });
    const toast = await import('react-hot-toast');

    const { result } = renderHook(() => useCreateAccount(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'Dup', type: 'cash', initial_balance: 0 });
      } catch { /* expected */ }
    });

    expect(toast.default.error).toHaveBeenCalled();
  });
});

describe('useUpdateAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates account successfully', async () => {
    mockUpdateAccount.mockResolvedValue({ data: { id: '1', name: 'Updated' }, error: null });

    const { result } = renderHook(() => useUpdateAccount(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({ id: '1', input: { name: 'Updated' } });
    });

    expect(mockUpdateAccount).toHaveBeenCalledWith('1', { name: 'Updated' });
  });

  it('handles error on update', async () => {
    mockUpdateAccount.mockResolvedValue({ data: null, error: { message: 'Not found' } });
    const toast = await import('react-hot-toast');

    const { result } = renderHook(() => useUpdateAccount(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: '1', input: { name: 'X' } });
      } catch { /* expected */ }
    });

    expect(toast.default.error).toHaveBeenCalled();
  });
});

describe('useDeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes account successfully', async () => {
    mockDeleteAccount.mockResolvedValue({ error: null });
    const toast = await import('react-hot-toast');

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockDeleteAccount).toHaveBeenCalledWith('1');
    expect(toast.default.success).toHaveBeenCalledWith('Account deleted');
  });

  it('handles error on delete', async () => {
    mockDeleteAccount.mockResolvedValue({ error: { message: 'FK violation' } });
    const toast = await import('react-hot-toast');

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: createWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync('1');
      } catch { /* expected */ }
    });

    expect(toast.default.error).toHaveBeenCalled();
  });
});

