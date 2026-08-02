/**
 * Integration test — Category soft-delete vs. uniqueness (migration 012).
 *
 * Vitest can't run real Postgres, so we model the DB contract that migration
 * 012 introduces: a PARTIAL unique index
 *
 *     CREATE UNIQUE INDEX ... ON user_categories (user_id, name, type)
 *       WHERE deleted_at IS NULL;
 *
 * The in-memory `store` below enforces exactly those semantics — a name+type
 * may only collide with a *live* (deleted_at IS NULL) row — and backs a mocked
 * service layer. We then drive the REAL hooks (useCreateCategory /
 * useDeleteCategory / useCategories) against a REAL React Query cache, proving
 * the full stack behaves correctly for the audited scenarios:
 *
 *   1. Create a category
 *   2. Delete it (soft delete — the row survives)
 *   3. Re-create the same name → succeeds (the exact bug 012 fixes)
 *   4. Create a genuine duplicate of a LIVE category → friendly toast, no throw
 *   5. Soft-deleted categories disappear from pickers, but the row (and thus
 *      the label historical transactions join to) survives intact.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import toast from 'react-hot-toast';
import type { ReactNode } from 'react';

vi.mock('react-hot-toast', () => ({
  // Callable default (toast()) + .success / .error, mirroring the real API.
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// ---- In-memory store modeling the partial unique index ----
type Row = {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  deleted_at: string | null;
};

let store: Row[] = [];
let idSeq = 0;

const liveRows = (userId: string) =>
  store.filter((r) => r.user_id === userId && r.deleted_at === null);

// Mocked service layer backed by `store`. Only the functions the audited hooks
// touch are implemented; the rest are inert vi.fn()s.
const mockCreateUserCategory = vi.fn(async (input: {
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}) => {
  const name = input.name.trim(); // service trims before insert
  // Partial unique index: collide ONLY against live rows of same name+type.
  const clash = liveRows(input.user_id).some(
    (r) => r.name === name && r.type === input.type,
  );
  if (clash) {
    return {
      data: null,
      error: {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "uniq_user_categories_active_name_type"',
      },
    };
  }
  const row: Row = {
    id: `cat-${++idSeq}`,
    user_id: input.user_id,
    name,
    type: input.type,
    color: input.color,
    icon: input.icon,
    deleted_at: null,
  };
  store.push(row);
  return { data: row, error: null };
});

const mockDeleteUserCategory = vi.fn(async (id: string, userId: string) => {
  const row = store.find((r) => r.id === id && r.user_id === userId);
  if (row) row.deleted_at = new Date().toISOString(); // SOFT delete — row kept
  return { error: null };
});

// Merged categories = LIVE user rows only (mirrors getUserCategories' deleted_at filter).
const mockGetMergedCategories = vi.fn(async (userId: string, type?: 'income' | 'expense') => {
  const rows = liveRows(userId)
    .filter((r) => (type ? r.type === type : true))
    .map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      color: r.color,
      icon: r.icon,
      source: 'user' as const,
      isDefault: false,
      isCustom: true,
      editable: true,
      deletable: true,
      source_category_id: null,
    }));
  return { data: rows, error: null };
});

vi.mock('@/services/categories', () => ({
  getMergedCategories: (...a: unknown[]) => mockGetMergedCategories(...(a as [string, ('income' | 'expense')?])),
  createUserCategory: (...a: unknown[]) => mockCreateUserCategory(...(a as [never])),
  deleteUserCategory: (...a: unknown[]) => mockDeleteUserCategory(...(a as [string, string])),
  // Unused by these hooks but imported by the module — keep them inert.
  updateUserCategory: vi.fn(),
  getHiddenSystemCategories: vi.fn(),
  hideSystemCategory: vi.fn(),
  restoreSystemCategory: vi.fn(),
  copySystemCategory: vi.fn(),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  const authValue = createMockAuth();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
          <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    );
  };
}

// Drive all three hooks against one shared cache.
function useCategoryHarness() {
  return {
    create: useCreateCategory(),
    del: useDeleteCategory(),
    list: useCategories(),
  };
}

const USER = 'user-123'; // matches createMockAuth()

describe('Category soft-delete vs. uniqueness (migration 012 contract)', () => {
  beforeEach(() => {
    store = [];
    idSeq = 0;
    vi.clearAllMocks();
  });

  it('re-creating the name of a soft-deleted category succeeds (the bug 012 fixes)', async () => {
    const { result } = renderHook(useCategoryHarness, { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    // 1. Create "Groceries".
    const created = await result.current.create.mutateAsync({
      name: 'Groceries', type: 'expense', color: '#ef4444', icon: 'utensils',
    });
    expect(created).not.toBeNull();
    const firstId = (created as { id: string }).id;
    await waitFor(() =>
      expect(result.current.list.data?.map((c) => c.name)).toContain('Groceries'),
    );

    // 2. Soft-delete it — the picker should drop it...
    await result.current.del.mutateAsync(firstId);
    await waitFor(() =>
      expect(result.current.list.data?.map((c) => c.name)).not.toContain('Groceries'),
    );
    // ...but the underlying row must SURVIVE (historical transactions still
    // join to it), just flagged deleted.
    const deletedRow = store.find((r) => r.id === firstId);
    expect(deletedRow).toBeDefined();
    expect(deletedRow?.deleted_at).not.toBeNull();
    expect(deletedRow?.name).toBe('Groceries'); // label intact for analytics/list

    // 3. Re-create "Groceries" — PRE-012 this threw a 23505; now it succeeds.
    const recreated = await result.current.create.mutateAsync({
      name: 'Groceries', type: 'expense', color: '#ef4444', icon: 'utensils',
    });
    expect(recreated).not.toBeNull();
    expect((recreated as { id: string }).id).not.toBe(firstId); // a fresh row
    expect(toast.error).not.toHaveBeenCalled();

    // Store now holds BOTH rows: the soft-deleted original + the fresh live one.
    expect(store).toHaveLength(2);
    expect(store.filter((r) => r.deleted_at === null)).toHaveLength(1);
    await waitFor(() =>
      expect(result.current.list.data?.map((c) => c.name)).toContain('Groceries'),
    );
  });

  it('prevents a duplicate of a LIVE category with a friendly toast, not an error', async () => {
    const { result } = renderHook(useCategoryHarness, { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    await result.current.create.mutateAsync({
      name: 'Rent', type: 'expense', color: '#3b82f6', icon: 'home',
    });
    vi.clearAllMocks(); // focus assertions on the SECOND (duplicate) attempt

    const dup = await result.current.create.mutateAsync({
      name: '  Rent  ', type: 'expense', color: '#3b82f6', icon: 'home',
    });

    // Benign no-op: null return, neutral toast, no red error, no false success.
    expect(dup).toBeNull();
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('already exists'), expect.anything());
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    // Only ever one live "Rent".
    expect(liveRows(USER).filter((r) => r.name === 'Rent')).toHaveLength(1);
  });

  it('allows the same name under a different type (index is on name AND type)', async () => {
    const { result } = renderHook(useCategoryHarness, { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));

    const expense = await result.current.create.mutateAsync({
      name: 'Bonus', type: 'expense', color: '#000', icon: 'tag',
    });
    const income = await result.current.create.mutateAsync({
      name: 'Bonus', type: 'income', color: '#000', icon: 'tag',
    });

    expect(expense).not.toBeNull();
    expect(income).not.toBeNull(); // different type ⇒ no clash
    expect(toast.error).not.toHaveBeenCalled();
    expect(liveRows(USER)).toHaveLength(2);
  });
});



