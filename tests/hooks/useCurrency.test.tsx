import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import type { ReactNode } from 'react';

vi.mock('@/services/profiles', () => ({
  getProfile: vi.fn().mockResolvedValue({ data: { currency: 'EUR' }, error: null }),
}));

describe('useCurrency', () => {
  it('returns INR as default when profile not loaded', () => {
    const queryClient = createTestQueryClient();
    const authValue = createMockAuth({ user: null });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCurrency(), { wrapper });
    expect(result.current).toBe('INR');
  });
});

