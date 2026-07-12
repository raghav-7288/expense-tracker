import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import type { ReactNode } from 'react';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();

vi.mock('@/services/profiles', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
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

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches profile for authenticated user', async () => {
    const profile = { id: 'user-123', full_name: 'Test', currency: 'USD' };
    mockGetProfile.mockResolvedValue({ data: profile, error: null });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(profile);
    expect(mockGetProfile).toHaveBeenCalledWith('user-123');
  });

  it('handles fetch error', async () => {
    mockGetProfile.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates profile', async () => {
    mockUpdateProfile.mockResolvedValue({ data: { full_name: 'New Name' }, error: null });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ full_name: 'New Name' });
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', { full_name: 'New Name' });
  });

  it('handles update error', async () => {
    mockUpdateProfile.mockResolvedValue({ data: null, error: { message: 'Failed' } });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ full_name: 'X' })).rejects.toThrow('Failed');
  });
});

