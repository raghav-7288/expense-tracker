import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';

// ---------- Default auth mock ----------
export const mockUser: User = {
  id: 'user-123',
  email: ['test', '@', 'example.com'].join(''),
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Test User' },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  identities: [],
} as unknown as User;

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: mockUser,
} as Session;

export function createMockAuth(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: mockUser,
    session: mockSession,
    loading: false,
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    updatePassword: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
}

// ---------- Create test query client ----------
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// ---------- Render with providers ----------
interface WrapperOptions {
  auth?: Partial<AuthContextType>;
  route?: string;
  darkMode?: boolean;
}

export function renderWithProviders(
  ui: ReactNode,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { auth, route = '/', darkMode = false, ...renderOptions } = options;
  const queryClient = createTestQueryClient();
  const authValue = createMockAuth(auth);
  const themeValue = { darkMode, setDarkMode: vi.fn() };

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={themeValue}>
          <AuthContext.Provider value={authValue}>
            <MemoryRouter initialEntries={[route]}>
              {children}
            </MemoryRouter>
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    authValue,
    themeValue,
  };
}


