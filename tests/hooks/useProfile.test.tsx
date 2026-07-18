import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import type { ReactNode } from 'react';

const { mockToast, mockGetProfile, mockUpdateProfile } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
  mockGetProfile: vi.fn(),
  mockUpdateProfile: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: mockToast,
}));

vi.mock('@/services/profiles', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
}));

function createWrapper(authOverrides: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  const authValue = createMockAuth(authOverrides);
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
    expect(result.current.error?.message).toBe('Not found');
  });

  it('does not fetch when user is null', async () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper({ user: null }),
    });
    // query should be disabled — not fetching
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetProfile).not.toHaveBeenCalled();
  });

  it('returns null data when user is null', async () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper({ user: null }),
    });
    expect(result.current.data).toBeUndefined();
  });
});

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates profile successfully', async () => {
    mockUpdateProfile.mockResolvedValue({ data: { full_name: 'New Name' }, error: null });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ full_name: 'New Name' });
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', { full_name: 'New Name' });
  });

  it('shows success toast on successful update', async () => {
    mockUpdateProfile.mockResolvedValue({ data: { full_name: 'New Name' }, error: null });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ full_name: 'New Name' });
    expect(mockToast.success).toHaveBeenCalledWith('Profile updated');
  });

  it('handles update error and throws', async () => {
    mockUpdateProfile.mockResolvedValue({ data: null, error: { message: 'Failed' } });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ full_name: 'X' })).rejects.toThrow('Failed');
  });

  it('shows error toast on update failure', async () => {
    mockUpdateProfile.mockResolvedValue({ data: null, error: { message: 'Server error' } });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    try {
      await result.current.mutateAsync({ full_name: 'X' });
    } catch {
      // expected
    }
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('throws if user is not authenticated', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper({ user: null }),
    });
    await expect(result.current.mutateAsync({ full_name: 'X' })).rejects.toThrow('Not authenticated');
  });

  it('can update currency', async () => {
    mockUpdateProfile.mockResolvedValue({ data: { currency: 'EUR' }, error: null });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ currency: 'EUR' });
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', { currency: 'EUR' });
  });

  it('can update multiple fields at once', async () => {
    mockUpdateProfile.mockResolvedValue({ data: { full_name: 'Jane', currency: 'GBP' }, error: null });
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ full_name: 'Jane', currency: 'GBP' });
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-123', { full_name: 'Jane', currency: 'GBP' });
  });
});
