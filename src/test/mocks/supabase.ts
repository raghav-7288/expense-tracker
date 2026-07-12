import { vi } from 'vitest';

/**
 * Creates a mock Supabase query builder with chainable methods.
 * Usage: const mock = createSupabaseQueryMock({ data: [...], error: null });
 */
export function createSupabaseQueryMock(result: { data?: unknown; error?: unknown }) {
  const finalResult = { data: result.data ?? null, error: result.error ?? null };

  const chain: Record<string, unknown> = {};
  const methods = ['from', 'select', 'insert', 'update', 'delete', 'eq', 'neq',
    'gte', 'lte', 'ilike', 'order', 'single', 'limit', 'range'];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods resolve the promise-like behavior
  chain['single'] = vi.fn().mockResolvedValue(finalResult);
  chain['then'] = vi.fn((cb: (v: unknown) => unknown) => Promise.resolve(cb(finalResult)));

  // Make the chain itself thenable for await
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(finalResult)),
    writable: true,
  });

  return chain;
}

/**
 * Creates a complete mock of the supabase client module.
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn(),
  };
}

