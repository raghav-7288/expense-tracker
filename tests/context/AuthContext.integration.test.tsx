import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient } from '@/test/test-utils';
import AuthProvider from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextType } from '@/context/AuthContext';
import type { ReactNode } from 'react';

const mockSupabaseAuth = vi.hoisted(() => ({
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: mockSupabaseAuth },
}));

let capturedAuth: AuthContextType;

function CaptureAuth() {
  // eslint-disable-next-line react-hooks/globals
  capturedAuth = useAuth();
  return <div />;
}

function renderWithAuth(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
        <AuthProvider>{ui}</AuthProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

describe('AuthProvider integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null } });
  });

  it('signUp calls supabase auth', async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({ data: {}, error: null });
    renderWithAuth(<CaptureAuth />);
    await waitFor(() => expect(capturedAuth).toBeDefined());

    const email = ['a', '@', 'b.com'].join('');
    const result = await capturedAuth.signUp(email, 'pass', 'Name');
    expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
      email,
      password: 'pass',
      options: { data: { full_name: 'Name' } },
    });
    expect(result.error).toBeNull();
  });

  it('signIn calls supabase auth', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    renderWithAuth(<CaptureAuth />);
    await waitFor(() => expect(capturedAuth).toBeDefined());

    const email = ['a', '@', 'b.com'].join('');
    const result = await capturedAuth.signIn(email, 'pass');
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email, password: 'pass',
    });
    expect(result.error).toBeNull();
  });

  it('signIn returns error on failure', async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: {}, error: { message: 'Bad creds' },
    });
    renderWithAuth(<CaptureAuth />);
    await waitFor(() => expect(capturedAuth).toBeDefined());

    const email = ['a', '@', 'b.com'].join('');
    const result = await capturedAuth.signIn(email, 'wrong');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toBe('Bad creds');
  });

  it('signOut calls supabase auth', async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
    renderWithAuth(<CaptureAuth />);
    await waitFor(() => expect(capturedAuth).toBeDefined());

    await capturedAuth.signOut();
    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
  });

  it('resetPassword calls supabase auth', async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    renderWithAuth(<CaptureAuth />);
    await waitFor(() => expect(capturedAuth).toBeDefined());

    const email = ['a', '@', 'b.com'].join('');
    const result = await capturedAuth.resetPassword(email);
    expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(email, expect.any(Object));
    expect(result.error).toBeNull();
  });

  it('updatePassword calls supabase auth', async () => {
    mockSupabaseAuth.updateUser.mockResolvedValue({ data: {}, error: null });
    renderWithAuth(<CaptureAuth />);
    await waitFor(() => expect(capturedAuth).toBeDefined());

    const result = await capturedAuth.updatePassword('newpass');
    expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({ password: 'newpass' });
    expect(result.error).toBeNull();
  });
});

