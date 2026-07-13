import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('returns context value when inside provider', () => {
    const mockValue: AuthContextType = {
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

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBe(mockValue);
  });
});

