import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeContext } from '@/context/ThemeContext';
import AuthProvider from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { createTestQueryClient } from '@/test/test-utils';
import type { ReactNode } from 'react';

const mockGetSession = vi.fn().mockResolvedValue({ data: { session: null } });
const mockOnAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } },
});
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: () => mockSignOut(),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

function TestConsumer() {
  const { user, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
    </div>
  );
}

function renderWithWrapper(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
        <AuthProvider>{ui}</AuthProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('starts in loading state then resolves', async () => {
    renderWithWrapper(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('sets user from initial session', async () => {
    const session = { user: { email: 'test@example.com' } };
    mockGetSession.mockResolvedValue({ data: { session } });

    renderWithWrapper(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });
});

