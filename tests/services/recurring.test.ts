import { describe, it, expect, vi, beforeEach } from 'vitest';

// Fixed "today" so generateDueTransactions is deterministic. planDueOccurrences
// takes `today` as an argument and does not depend on this mock.
vi.mock('@/utils/formatDate', () => ({ getToday: () => '2026-03-15' }));

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

import {
  planDueOccurrences,
  nthOccurrence,
  generateDueTransactions,
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@/services/recurring';

// ============================================================
// PURE SCHEDULING CORE — planDueOccurrences / nthOccurrence
// (deterministic, no mocks)
// ============================================================
describe('recurring scheduling core', () => {
  describe('nthOccurrence (anchored on start date)', () => {
    it('weekly steps by 7 days', () => {
      expect(nthOccurrence('2026-03-01', 'weekly', 0)).toBe('2026-03-01');
      expect(nthOccurrence('2026-03-01', 'weekly', 3)).toBe('2026-03-22');
    });

    it('monthly anchored on the 31st clamps per-month WITHOUT drifting', () => {
      expect(nthOccurrence('2026-01-31', 'monthly', 0)).toBe('2026-01-31');
      expect(nthOccurrence('2026-01-31', 'monthly', 1)).toBe('2026-02-28'); // clamp
      expect(nthOccurrence('2026-01-31', 'monthly', 2)).toBe('2026-03-31'); // restores
      expect(nthOccurrence('2026-01-31', 'monthly', 3)).toBe('2026-04-30'); // clamp
    });

    it('yearly on Feb 29 restores on the next leap year', () => {
      expect(nthOccurrence('2028-02-29', 'yearly', 0)).toBe('2028-02-29');
      expect(nthOccurrence('2028-02-29', 'yearly', 1)).toBe('2029-02-28'); // clamp
      expect(nthOccurrence('2028-02-29', 'yearly', 4)).toBe('2032-02-29'); // leap restore
    });
  });

  describe('planDueOccurrences — weekly', () => {
    it('catches up every missed week (app opened after several days)', () => {
      const plan = planDueOccurrences(
        { startDate: '2026-03-01', nextDueDate: '2026-03-01', endDate: null, frequency: 'weekly' },
        '2026-03-15',
      );
      expect(plan.dueDates).toEqual(['2026-03-01', '2026-03-08', '2026-03-15']);
      expect(plan.nextDueDate).toBe('2026-03-22');
      expect(plan.isActive).toBe(true);
    });
  });

  describe('planDueOccurrences — monthly month-end (regression)', () => {
    it('does NOT drift to the 28th after February', () => {
      const plan = planDueOccurrences(
        { startDate: '2026-01-31', nextDueDate: '2026-01-31', endDate: null, frequency: 'monthly' },
        '2026-05-15',
      );
      // The bug produced Mar 28 / Apr 28; anchored logic keeps the month-end.
      expect(plan.dueDates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
      expect(plan.dueDates).not.toContain('2026-03-28');
      expect(plan.dueDates).not.toContain('2026-04-28');
      expect(plan.nextDueDate).toBe('2026-05-31');
    });

    it('re-anchors a cursor that was previously clamped', () => {
      // Cursor sitting on the clamped Feb 28 should still yield Mar 31 next.
      const plan = planDueOccurrences(
        { startDate: '2026-01-31', nextDueDate: '2026-02-28', endDate: null, frequency: 'monthly' },
        '2026-03-31',
      );
      expect(plan.dueDates).toEqual(['2026-02-28', '2026-03-31']);
      expect(plan.nextDueDate).toBe('2026-04-30');
    });
  });

  describe('planDueOccurrences — yearly leap year (regression)', () => {
    it('restores Feb 29 on the next leap year instead of sticking at Feb 28', () => {
      const plan = planDueOccurrences(
        { startDate: '2028-02-29', nextDueDate: '2028-02-29', endDate: null, frequency: 'yearly' },
        '2032-03-01',
      );
      expect(plan.dueDates).toEqual([
        '2028-02-29',
        '2029-02-28',
        '2030-02-28',
        '2031-02-28',
        '2032-02-29', // leap-year restoration
      ]);
      expect(plan.dueDates).not.toContain('2032-02-28');
    });
  });

  describe('planDueOccurrences — end date handling', () => {
    it('includes the end date occurrence then deactivates', () => {
      const plan = planDueOccurrences(
        { startDate: '2026-01-01', nextDueDate: '2026-01-01', endDate: '2026-03-01', frequency: 'monthly' },
        '2026-06-01',
      );
      expect(plan.dueDates).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);
      expect(plan.isActive).toBe(false);
    });

    it('stops before an occurrence that falls past the end date', () => {
      const plan = planDueOccurrences(
        { startDate: '2026-01-01', nextDueDate: '2026-01-01', endDate: '2026-02-15', frequency: 'monthly' },
        '2026-06-01',
      );
      expect(plan.dueDates).toEqual(['2026-01-01', '2026-02-01']);
      expect(plan.isActive).toBe(false);
    });
  });

  describe('planDueOccurrences — edge cases', () => {
    it('generates nothing for a future start date and stays active', () => {
      const plan = planDueOccurrences(
        { startDate: '2026-04-01', nextDueDate: '2026-04-01', endDate: null, frequency: 'monthly' },
        '2026-03-15',
      );
      expect(plan.dueDates).toEqual([]);
      expect(plan.nextDueDate).toBe('2026-04-01');
      expect(plan.isActive).toBe(true);
    });

    it('honours the safety cap on runaway catch-up', () => {
      const plan = planDueOccurrences(
        { startDate: '2020-01-01', nextDueDate: '2020-01-01', endDate: null, frequency: 'weekly' },
        '2026-01-01',
        5,
      );
      expect(plan.dueDates).toHaveLength(5);
      expect(plan.nextDueDate).toBe('2020-02-05');
      expect(plan.isActive).toBe(true);
    });

    it('is idempotent: replaying with the advanced cursor yields nothing', () => {
      const first = planDueOccurrences(
        { startDate: '2026-01-01', nextDueDate: '2026-01-01', endDate: null, frequency: 'monthly' },
        '2026-03-15',
      );
      expect(first.dueDates).toEqual(['2026-01-01', '2026-02-01', '2026-03-01']);

      const second = planDueOccurrences(
        { startDate: '2026-01-01', nextDueDate: first.nextDueDate, endDate: null, frequency: 'monthly' },
        '2026-03-15',
      );
      expect(second.dueDates).toEqual([]);
    });
  });
});

// ============================================================
// GENERATOR INTEGRATION — generateDueTransactions
// Stateful supabase mock: updates persist to the in-memory store so
// "exactly once" idempotency can be verified across repeated calls.
// ============================================================
interface RuleRow {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  notes: string;
  account_id: string | null;
  system_category_id: string | null;
  user_category_id: string | null;
  frequency: string;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  is_active: boolean;
}

function installSupabase(rules: RuleRow[]) {
  const captured = {
    inserts: [] as Array<Record<string, unknown>>,
    updates: [] as Array<{ id: string; data: Record<string, unknown> }>,
  };

  mockFrom.mockImplementation((table: string) => {
    const filters: Record<string, unknown> = {};
    const state: { op: 'select' | 'insert' | 'update'; rows: Record<string, unknown>[] | null; data: Record<string, unknown> | null } = {
      op: 'select',
      rows: null,
      data: null,
    };

    const builder: Record<string, unknown> = {
      select: () => builder,
      insert: (rows: Record<string, unknown>[]) => {
        state.op = 'insert';
        state.rows = rows;
        return builder;
      },
      update: (data: Record<string, unknown>) => {
        state.op = 'update';
        state.data = data;
        return builder;
      },
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return builder;
      },
      lte: (col: string, val: unknown) => {
        filters[`${col}__lte`] = val;
        return builder;
      },
      then: (resolve: (v: unknown) => void) => {
        let result: unknown;
        if (table === 'recurring_transactions' && state.op === 'select') {
          let rows = rules.filter((r) => r.user_id === filters['user_id']);
          if ('is_active' in filters) rows = rows.filter((r) => r.is_active === filters['is_active']);
          if ('next_due_date__lte' in filters) {
            rows = rows.filter((r) => r.next_due_date <= (filters['next_due_date__lte'] as string));
          }
          result = { data: rows.map((r) => ({ ...r })), error: null };
        } else if (state.op === 'insert') {
          for (const row of state.rows ?? []) captured.inserts.push(row);
          result = { error: null };
        } else if (state.op === 'update') {
          const id = filters['id'] as string;
          const target = rules.find((r) => r.id === id);
          if (target) Object.assign(target, state.data);
          captured.updates.push({ id, data: state.data ?? {} });
          result = { error: null };
        } else {
          result = { data: null, error: null };
        }
        return Promise.resolve(result).then(resolve);
      },
    };
    return builder;
  });

  return captured;
}

function makeRule(overrides: Partial<RuleRow> = {}): RuleRow {
  return {
    id: 'rule-1',
    user_id: 'user-1',
    type: 'expense',
    amount: 42.5,
    notes: 'Rent',
    account_id: 'acc-1',
    system_category_id: null,
    user_category_id: 'ucat-1',
    frequency: 'monthly',
    start_date: '2026-01-31',
    end_date: null,
    next_due_date: '2026-01-31',
    is_active: true,
    ...overrides,
  };
}

describe('generateDueTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates due transactions with all template fields and the recurring_id link', async () => {
    const rules = [makeRule()];
    const captured = installSupabase(rules);

    const { generated, error } = await generateDueTransactions('user-1');

    expect(error).toBeNull();
    // Jan 31 + Feb 28 are due by the fixed today (2026-03-15); Mar 31 is not.
    expect(generated).toBe(2);
    expect(captured.inserts.map((r) => r.date)).toEqual(['2026-01-31', '2026-02-28']);

    const first = captured.inserts[0];
    expect(first).toMatchObject({
      user_id: 'user-1',
      type: 'expense',
      amount: 42.5,
      notes: 'Rent',
      account_id: 'acc-1',
      system_category_id: null,
      user_category_id: 'ucat-1',
      recurring_id: 'rule-1',
    });
  });

  it('advances the rule cursor to the next un-generated occurrence', async () => {
    const rules = [makeRule()];
    const captured = installSupabase(rules);

    await generateDueTransactions('user-1');

    expect(captured.updates).toHaveLength(1);
    expect(captured.updates[0]).toMatchObject({
      id: 'rule-1',
      data: { next_due_date: '2026-03-31', is_active: true },
    });
    // The store cursor was persisted.
    expect(rules[0]?.next_due_date).toBe('2026-03-31');
  });

  it('creates each occurrence exactly once across repeated runs (no duplicates)', async () => {
    const rules = [makeRule()];
    const captured = installSupabase(rules);

    const firstRun = await generateDueTransactions('user-1');
    expect(firstRun.generated).toBe(2);

    // Second run: the cursor is now past today, so nothing new is generated.
    const secondRun = await generateDueTransactions('user-1');
    expect(secondRun.generated).toBe(0);
    expect(captured.inserts).toHaveLength(2);
  });

  it('processes multiple rules due simultaneously and skips paused ones', async () => {
    const rules = [
      makeRule({ id: 'rule-1', notes: 'Rent', frequency: 'monthly', start_date: '2026-03-01', next_due_date: '2026-03-01' }),
      makeRule({ id: 'rule-2', notes: 'Gym', frequency: 'weekly', start_date: '2026-03-01', next_due_date: '2026-03-01', user_category_id: null, system_category_id: 'scat-1' }),
      makeRule({ id: 'rule-3', notes: 'Paused', is_active: false, start_date: '2026-01-01', next_due_date: '2026-01-01' }),
    ];
    const captured = installSupabase(rules);

    const { generated } = await generateDueTransactions('user-1');

    const byRule = captured.inserts.reduce<Record<string, number>>((acc, row) => {
      const id = row.recurring_id as string;
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});

    expect(byRule['rule-1']).toBe(1); // Mar 1 only (monthly)
    expect(byRule['rule-2']).toBe(3); // Mar 1, 8, 15 (weekly)
    expect(byRule['rule-3']).toBeUndefined(); // paused → excluded
    expect(generated).toBe(4);
  });

  it('deactivates a rule once it passes its end date', async () => {
    const rules = [
      makeRule({
        frequency: 'monthly',
        start_date: '2026-01-01',
        next_due_date: '2026-01-01',
        end_date: '2026-02-15',
      }),
    ];
    const captured = installSupabase(rules);

    const { generated } = await generateDueTransactions('user-1');

    expect(generated).toBe(2); // Jan 1, Feb 1 (Mar 1 is past end date)
    expect(captured.updates[0]?.data).toMatchObject({ is_active: false });
    expect(rules[0]?.is_active).toBe(false);
  });

  it('propagates a query error without generating', async () => {
    mockFrom.mockImplementation(() => {
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        lte: () => builder,
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve({ data: null, error: { message: 'boom' } }).then(resolve),
      };
      return builder;
    });

    const { generated, error } = await generateDueTransactions('user-1');
    expect(generated).toBe(0);
    expect(error).toEqual({ message: 'boom' });
  });
});

// ============================================================
// CRUD — getRecurringTransactions / create / update / delete
// Covers normalization (system vs user category, account join) and
// the category-column resolver (system_categories lookup then fallback).
// ============================================================

/** Fully-chainable Supabase mock whose whole chain resolves to `terminalValue`. */
function buildChain(terminalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: ReturnType<typeof vi.fn> } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybeSingle'];
  for (const m of methods) chain[m] = vi.fn().mockImplementation(() => chain);
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) =>
    Promise.resolve(terminalValue).then(resolve),
  );
  return chain;
}

/**
 * Route each supabase.from(table) to its own chain. `systemCatHit` decides
 * whether the system_categories lookup resolves to a row (→ system category)
 * or null (→ user category fallback). Returns the per-table chains for asserts.
 */
function installCrud(opts: {
  systemCatHit?: boolean;
  recurringResult?: unknown;
}) {
  const chains: Record<string, ReturnType<typeof buildChain>> = {};
  mockFrom.mockImplementation((table: string) => {
    const terminal =
      table === 'system_categories'
        ? { data: opts.systemCatHit ? { id: 'cat-x' } : null, error: null }
        : opts.recurringResult ?? { data: null, error: null };
    const chain = buildChain(terminal);
    chains[table] = chain;
    return chain;
  });
  return chains;
}

function rawRecurringRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rr-1',
    user_id: 'user-1',
    type: 'expense',
    amount: 42.5,
    notes: 'Rent',
    system_category_id: null,
    user_category_id: null,
    account_id: null,
    frequency: 'monthly',
    start_date: '2026-01-01',
    end_date: null,
    next_due_date: '2026-01-01',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    system_cat: null,
    user_cat: null,
    account: null,
    ...overrides,
  };
}

describe('getRecurringTransactions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalizes a rule with a joined SYSTEM category', async () => {
    const row = rawRecurringRow({
      system_category_id: 'sc-1',
      system_cat: { id: 'sc-1', name: 'Housing', color: '#3b82f6', icon: 'home' },
    });
    installCrud({ recurringResult: { data: [row], error: null } });

    const { data, error } = await getRecurringTransactions('user-1');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]?.category_id).toBe('sc-1');
    expect(data?.[0]?.categories?.name).toBe('Housing');
    expect(data?.[0]?.amount).toBe(42.5);
  });

  it('prefers the user category and joins the account when present', async () => {
    const row = rawRecurringRow({
      user_category_id: 'uc-9',
      user_cat: { id: 'uc-9', name: 'Subscriptions', color: '#10b981', icon: 'tv' },
      account_id: 'acc-1',
      account: { id: 'acc-1', name: 'Checking', color: '#000000' },
    });
    installCrud({ recurringResult: { data: [row], error: null } });

    const { data } = await getRecurringTransactions('user-1');

    expect(data?.[0]?.category_id).toBe('uc-9');
    expect(data?.[0]?.categories?.name).toBe('Subscriptions');
    expect(data?.[0]?.account?.name).toBe('Checking');
  });

  it('passes a query error straight through', async () => {
    installCrud({ recurringResult: { data: null, error: { message: 'select failed' } } });
    const { data, error } = await getRecurringTransactions('user-1');
    expect(data).toBeNull();
    expect(error).toEqual({ message: 'select failed' });
  });
});

describe('createRecurringTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves a SYSTEM category id into system_category_id and seeds the cursor', async () => {
    const chains = installCrud({
      systemCatHit: true,
      recurringResult: { data: rawRecurringRow({ system_category_id: 'cat-x' }), error: null },
    });

    const { data, error } = await createRecurringTransaction({
      user_id: 'user-1', type: 'expense', amount: 42.5, notes: 'Rent',
      category_id: 'cat-x', account_id: null, frequency: 'monthly',
      start_date: '2026-01-01', end_date: null,
    });

    expect(error).toBeNull();
    expect(data?.id).toBe('rr-1');
    const insertArg = chains['recurring_transactions']?.insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertArg).toMatchObject({
      system_category_id: 'cat-x',
      user_category_id: null,
      // First occurrence is due on the start date; rule starts active.
      next_due_date: '2026-01-01',
      is_active: true,
    });
  });

  it('falls back to user_category_id when the id is not a system category', async () => {
    const chains = installCrud({
      systemCatHit: false,
      recurringResult: { data: rawRecurringRow({ user_category_id: 'uc-1' }), error: null },
    });

    await createRecurringTransaction({
      user_id: 'user-1', type: 'income', amount: 10, notes: 'Salary',
      category_id: 'uc-1', account_id: 'acc-1', frequency: 'weekly',
      start_date: '2026-02-01', end_date: '2026-12-31',
    });

    const insertArg = chains['recurring_transactions']?.insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertArg).toMatchObject({
      system_category_id: null,
      user_category_id: 'uc-1',
      account_id: 'acc-1',
      end_date: '2026-12-31',
      next_due_date: '2026-02-01',
    });
  });

  it('does no category lookup when category_id is null', async () => {
    const chains = installCrud({
      recurringResult: { data: rawRecurringRow(), error: null },
    });

    await createRecurringTransaction({
      user_id: 'user-1', type: 'expense', amount: 5, notes: 'x',
      category_id: null, account_id: null, frequency: 'monthly',
      start_date: '2026-01-01', end_date: null,
    });

    expect(chains['system_categories']).toBeUndefined();
    const insertArg = chains['recurring_transactions']?.insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertArg).toMatchObject({ system_category_id: null, user_category_id: null });
  });

  it('passes an insert error through', async () => {
    installCrud({ recurringResult: { data: null, error: { message: 'insert failed' } } });
    const { data, error } = await createRecurringTransaction({
      user_id: 'user-1', type: 'expense', amount: 5, notes: 'x',
      category_id: null, account_id: null, frequency: 'monthly',
      start_date: '2026-01-01', end_date: null,
    });
    expect(data).toBeNull();
    expect(error).toEqual({ message: 'insert failed' });
  });
});

describe('updateRecurringTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends only the provided fields (partial update)', async () => {
    const chains = installCrud({
      recurringResult: { data: rawRecurringRow({ is_active: false }), error: null },
    });

    await updateRecurringTransaction('rr-1', { is_active: false, amount: 99 });

    const updateArg = chains['recurring_transactions']?.update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(updateArg).toEqual({ is_active: false, amount: 99 });
    // Untouched fields must not be written.
    expect(updateArg).not.toHaveProperty('notes');
    expect(updateArg).not.toHaveProperty('frequency');
  });

  it('resolves category_id (system) into the FK columns when provided', async () => {
    const chains = installCrud({
      systemCatHit: true,
      recurringResult: { data: rawRecurringRow(), error: null },
    });

    await updateRecurringTransaction('rr-1', { category_id: 'cat-x' });

    const updateArg = chains['recurring_transactions']?.update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(updateArg).toMatchObject({ system_category_id: 'cat-x', user_category_id: null });
  });

  it('passes an update error through', async () => {
    installCrud({ recurringResult: { data: null, error: { message: 'update failed' } } });
    const { data, error } = await updateRecurringTransaction('rr-1', { amount: 1 });
    expect(data).toBeNull();
    expect(error).toEqual({ message: 'update failed' });
  });
});

describe('deleteRecurringTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('hard-deletes the rule by id and returns any error', async () => {
    const chains = installCrud({ recurringResult: { error: null } });

    const { error } = await deleteRecurringTransaction('rr-1');

    expect(error).toBeNull();
    expect(chains['recurring_transactions']?.delete).toHaveBeenCalled();
    expect(chains['recurring_transactions']?.eq).toHaveBeenCalledWith('id', 'rr-1');
  });

  it('returns the error when the delete fails', async () => {
    installCrud({ recurringResult: { error: { message: 'delete failed' } } });
    const { error } = await deleteRecurringTransaction('rr-1');
    expect(error).toEqual({ message: 'delete failed' });
  });
});

