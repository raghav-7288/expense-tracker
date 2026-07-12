import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import type { ReactNode } from 'react';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockGetCategories = vi.fn();
const mockCreateCategory = vi.fn();
const mockUpdateCategory = vi.fn();
const mockDeleteCategory = vi.fn();

vi.mock('@/services/categories', () => ({
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
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

  it('fetches categories when user is authenticated', async () => {
    const data = [{ id: '1', name: 'Food' }];
    mockGetCategories.mockResolvedValue({ data, error: null });

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
    // Query is disabled when no user
    expect(result.current.data).toBeUndefined();
  });

  it('passes type filter to service', async () => {
    mockGetCategories.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useCategories('expense'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetCategories).toHaveBeenCalledWith('user-123', 'expense');
  });

  it('throws on service error', async () => {
    mockGetCategories.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a category', async () => {
    mockCreateCategory.mockResolvedValue({ data: { id: '1', name: 'New' }, error: null });
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: 'New', type: 'expense', color: '#000', icon: 'tag' });
    expect(mockCreateCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'New', user_id: 'user-123' }));
  });

  it('handles error', async () => {
    mockCreateCategory.mockResolvedValue({ data: null, error: { message: 'Failed' } });
    const { result } = renderHook(() => useCreateCategory(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ name: 'X', type: 'expense', color: '#000', icon: 'tag' })
    ).rejects.toThrow('Failed');
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a category', async () => {
    mockUpdateCategory.mockResolvedValue({ data: { id: '1', name: 'Updated' }, error: null });
    const { result } = renderHook(() => useUpdateCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: '1', input: { name: 'Updated' } });
    expect(mockUpdateCategory).toHaveBeenCalledWith('1', { name: 'Updated' });
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a category', async () => {
    mockDeleteCategory.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });
    await result.current.mutateAsync('1');
    expect(mockDeleteCategory).toHaveBeenCalledWith('1');
  });

  it('handles delete error', async () => {
    mockDeleteCategory.mockResolvedValue({ error: { message: 'Cannot delete' } });
    const { result } = renderHook(() => useDeleteCategory(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('1')).rejects.toThrow('Cannot delete');
  });
});

