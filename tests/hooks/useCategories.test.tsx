import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useHiddenCategories, useHideCategory, useRestoreCategory, useCopyCategory } from '@/hooks/useCategories';
import toast from 'react-hot-toast';
import type { ReactNode } from 'react';

vi.mock('react-hot-toast', () => ({
  // Callable default export (toast()) with .success / .error helpers attached,
  // mirroring react-hot-toast's real API.
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const mockGetMergedCategories = vi.fn();
const mockCreateUserCategory = vi.fn();
const mockUpdateUserCategory = vi.fn();
const mockDeleteUserCategory = vi.fn();
const mockGetHiddenSystemCategories = vi.fn();
const mockHideSystemCategory = vi.fn();
const mockRestoreSystemCategory = vi.fn();
const mockCopySystemCategory = vi.fn();

vi.mock('@/services/categories', () => ({
  getMergedCategories: (...args: unknown[]) => mockGetMergedCategories(...args),
  createUserCategory: (...args: unknown[]) => mockCreateUserCategory(...args),
  updateUserCategory: (...args: unknown[]) => mockUpdateUserCategory(...args),
  deleteUserCategory: (...args: unknown[]) => mockDeleteUserCategory(...args),
  getHiddenSystemCategories: (...args: unknown[]) => mockGetHiddenSystemCategories(...args),
  hideSystemCategory: (...args: unknown[]) => mockHideSystemCategory(...args),
  restoreSystemCategory: (...args: unknown[]) => mockRestoreSystemCategory(...args),
  copySystemCategory: (...args: unknown[]) => mockCopySystemCategory(...args),
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

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches merged categories when user is authenticated', async () => {
    const data = [{ id: '1', name: 'Food', source: 'system' }];
    mockGetMergedCategories.mockResolvedValue({ data, error: null });

    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it('returns empty array when no user', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => {
      const queryClient = createTestQueryClient();
      const authValue = createMockAuth({ user: null });
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
    const { result } = renderHook(() => useCategories(), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it('passes type filter to service', async () => {
    mockGetMergedCategories.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useCategories('expense'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetMergedCategories).toHaveBeenCalledWith('user-123', 'expense');
  });

  it('throws on service error', async () => {
    mockGetMergedCategories.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a category', async () => {
    mockCreateUserCategory.mockResolvedValue({ data: { id: '1', name: 'New' }, error: null });
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: 'New', type: 'expense', color: '#000', icon: 'tag' });
    expect(mockCreateUserCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'New', user_id: 'user-123' }));
  });

  it('handles error', async () => {
    mockCreateUserCategory.mockResolvedValue({ data: null, error: { message: 'Failed' } });
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ name: 'X', type: 'expense', color: '#000', icon: 'tag' })
    ).rejects.toThrow('Failed');
  });

  it('shows a friendly toast (and does not throw) when a live category already exists', async () => {
    mockCreateUserCategory.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "uniq_user_categories_active_name_type"' },
    });
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    const returned = await result.current.mutateAsync({ name: '  Test  ', type: 'expense', color: '#000', icon: 'tag' });

    // Benign no-op: resolves with null, informs via a neutral toast, and
    // never fires the red error toast or the success toast.
    expect(returned).toBeNull();
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('already exists'), expect.anything());
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('re-creating the name of a previously deleted category succeeds (post-012 contract)', async () => {
    // After migration 012 the partial unique index ignores soft-deleted rows,
    // so the service inserts a fresh row and returns it — the hook must treat
    // this as a normal success (data + success toast), NOT a duplicate.
    mockCreateUserCategory.mockResolvedValue({ data: { id: 'fresh', name: 'Test', type: 'expense' }, error: null });
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });

    const returned = await result.current.mutateAsync({ name: 'Test', type: 'expense', color: '#000', icon: 'tag' });

    expect(returned).toEqual({ id: 'fresh', name: 'Test', type: 'expense' });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Category created'));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('invalidates the whole categories prefix so every consumer refreshes immediately', async () => {
    // Regression: a new category must appear at once in the Categories page,
    // the transaction/recurring form dropdowns, and the filters. Those are
    // distinct query keys under ['categories'], so the create must invalidate
    // the prefix (React Query matches by prefix).
    mockCreateUserCategory.mockResolvedValue({ data: { id: '1', name: 'New' }, error: null });

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const authValue = createMockAuth();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
          <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateCategory(), { wrapper });
    await result.current.mutateAsync({ name: 'New', type: 'expense', color: '#000', icon: 'tag' });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['categories'] }),
    );
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a category', async () => {
    mockUpdateUserCategory.mockResolvedValue({ data: { id: '1', name: 'Updated' }, error: null });
    const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: '1', input: { name: 'Updated' } });
    expect(mockUpdateUserCategory).toHaveBeenCalledWith('1', 'user-123', { name: 'Updated' });
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a category', async () => {
    mockDeleteUserCategory.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync('1');
    expect(mockDeleteUserCategory).toHaveBeenCalledWith('1', 'user-123');
  });

  it('handles delete error', async () => {
    mockDeleteUserCategory.mockResolvedValue({ error: { message: 'Cannot delete' } });
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('1')).rejects.toThrow('Cannot delete');
  });
});

describe('useHiddenCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches hidden categories', async () => {
    const data = [{ id: 'h1', name: 'Hidden Cat', type: 'expense', color: '#000', icon: 'tag' }];
    mockGetHiddenSystemCategories.mockResolvedValue({ data, error: null });
    const { result } = renderHook(() => useHiddenCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it('returns empty array when no user', () => {
    const wrapper = ({ children }: { children: ReactNode }) => {
      const queryClient = createTestQueryClient();
      const authValue = createMockAuth({ user: null });
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
    const { result } = renderHook(() => useHiddenCategories(), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it('throws on service error', async () => {
    mockGetHiddenSystemCategories.mockResolvedValue({ data: null, error: { message: 'fail' } });
    const { result } = renderHook(() => useHiddenCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useHideCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides a system category', async () => {
    mockHideSystemCategory.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useHideCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync('cat-1');
    expect(mockHideSystemCategory).toHaveBeenCalledWith('user-123', 'cat-1');
  });

  it('handles hide error', async () => {
    mockHideSystemCategory.mockResolvedValue({ error: { message: 'Cannot hide' } });
    const { result } = renderHook(() => useHideCategory(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('cat-1')).rejects.toThrow('Cannot hide');
  });
});

describe('useRestoreCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores a hidden category', async () => {
    mockRestoreSystemCategory.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useRestoreCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync('cat-1');
    expect(mockRestoreSystemCategory).toHaveBeenCalledWith('user-123', 'cat-1');
  });

  it('handles restore error', async () => {
    mockRestoreSystemCategory.mockResolvedValue({ error: { message: 'Cannot restore' } });
    const { result } = renderHook(() => useRestoreCategory(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('cat-1')).rejects.toThrow('Cannot restore');
  });
});

describe('useCopyCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('copies a system category', async () => {
    mockCopySystemCategory.mockResolvedValue({ data: { id: 'new-1', name: 'Copy' }, error: null });
    const { result } = renderHook(() => useCopyCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync('cat-1');
    expect(mockCopySystemCategory).toHaveBeenCalledWith('user-123', 'cat-1');
  });

  it('handles copy error', async () => {
    mockCopySystemCategory.mockResolvedValue({ data: null, error: { message: 'Copy failed' } });
    const { result } = renderHook(() => useCopyCategory(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('cat-1')).rejects.toThrow('Copy failed');
  });
});

