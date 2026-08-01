/**
 * End-to-end flow test for the Lend/Borrow feature.
 *
 * Tests the full lifecycle:
 * 1. Create a loan → verify disbursement transaction is created
 * 2. Record a partial repayment → verify outstanding decreases, status = partially_paid
 * 3. Record final repayment → verify loan is settled
 * 4. Verify loan summary calculations
 * 5. Verify loan transactions history
 * 6. Delete a loan → verify linked transactions are cleaned up
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLoan,
  recordRepayment,
  getLoanSummary,
  getLoanTransactions,
  deleteLoan,
} from '@/services/loans';

// ---------- Supabase mock infrastructure ----------

interface MockRow {
  [key: string]: unknown;
}

/**
 * In-memory store to simulate Supabase tables
 */
let loansStore: MockRow[] = [];
let transactionsStore: MockRow[] = [];
let loanTransactionsStore: MockRow[] = [];

function buildInMemoryChain(table: string) {
  let filterField: string | undefined;
  let filterValue: unknown;
  let insertData: MockRow | undefined;
  let updateData: MockRow | undefined;
  let selectFields: string | undefined;
  let deleteMode = false;
  let inField: string | undefined;
  let inValues: unknown[] | undefined;

  function getStore(): MockRow[] {
    switch (table) {
      case 'loans': return loansStore;
      case 'transactions': return transactionsStore;
      case 'loan_transactions': return loanTransactionsStore;
      default: return [];
    }
  }

  function setStore(data: MockRow[]) {
    switch (table) {
      case 'loans': loansStore = data; break;
      case 'transactions': transactionsStore = data; break;
      case 'loan_transactions': loanTransactionsStore = data; break;
    }
  }

  const chain: Record<string, unknown> = {};

  chain.select = vi.fn((fields?: string) => { selectFields = fields; return chain; });
  chain.insert = vi.fn((data: MockRow) => { insertData = data; return chain; });
  chain.update = vi.fn((data: MockRow) => { updateData = data; return chain; });
  chain.delete = vi.fn(() => { deleteMode = true; return chain; });
  chain.eq = vi.fn((field: string, value: unknown) => { filterField = field; filterValue = value; return chain; });
  chain.in = vi.fn((field: string, values: unknown[]) => { inField = field; inValues = values; return chain; });
  chain.order = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.ilike = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => {
    const store = getStore();
    const found = store.find((r) => filterField && r[filterField] === filterValue);
    return Promise.resolve({ data: found ?? null, error: null });
  });

  chain.single = vi.fn(() => {
    if (insertData) {
      const id = `${table.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newRow = { id, ...insertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const store = getStore();
      store.push(newRow);
      setStore(store);
      insertData = undefined;
      return Promise.resolve({ data: newRow, error: null });
    }
    if (updateData) {
      const store = getStore();
      const idx = store.findIndex((r) => filterField && r[filterField] === filterValue);
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...updateData };
        setStore(store);
        updateData = undefined;
        return Promise.resolve({ data: store[idx], error: null });
      }
      updateData = undefined;
      return Promise.resolve({ data: null, error: { message: 'Not found' } });
    }
    // Select single
    const store = getStore();
    const found = store.find((r) => filterField && r[filterField] === filterValue);
    return Promise.resolve({ data: found ?? null, error: found ? null : { message: 'Not found' } });
  });

  // Make chain thenable for queries that return arrays
  Object.defineProperty(chain, 'then', {
    value: (resolve: (v: unknown) => unknown) => {
      if (deleteMode) {
        deleteMode = false;
        let store = getStore();
        if (inField && inValues) {
          store = store.filter((r) => !inValues!.includes(r[inField!]));
          setStore(store);
          inField = undefined;
          inValues = undefined;
        } else if (filterField) {
          store = store.filter((r) => r[filterField!] !== filterValue);
          setStore(store);
        }
        return Promise.resolve(resolve({ data: null, error: null }));
      }
      if (insertData) {
        const id = `${table.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newRow = { id, ...insertData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        const store = getStore();
        store.push(newRow);
        setStore(store);
        insertData = undefined;
        return Promise.resolve(resolve({ data: newRow, error: null }));
      }
      // Select: return filtered array
      let store = getStore();
      if (filterField) {
        store = store.filter((r) => r[filterField!] === filterValue);
      }
      if (selectFields) {
        selectFields = undefined;
      }
      return Promise.resolve(resolve({ data: store, error: null }));
    },
    writable: true,
    configurable: true,
  });

  return chain;
}

const mockFrom = vi.fn((table: string) => buildInMemoryChain(table));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

describe('Loans E2E Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loansStore = [];
    transactionsStore = [];
    loanTransactionsStore = [];
  });

  describe('Complete Lend Flow: Create → Partial Repayment → Full Settlement', () => {
    it('creates a lent loan and generates a disbursement transaction', async () => {
      const result = await createLoan({
        user_id: 'user-1',
        counterparty_name: 'Rahul',
        type: 'lent',
        principal_amount: 5000,
        outstanding_amount: 5000,
        due_date: '2026-09-01',
        notes: 'For rent deposit',
      });

      // Loan should be created
      expect(result.data).not.toBeNull();
      expect(result.data?.counterparty_name).toBe('Rahul');
      expect(result.data?.type).toBe('lent');
      expect(result.data?.principal_amount).toBe(5000);
      expect(result.data?.outstanding_amount).toBe(5000);
      expect(result.data?.status).toBe('active');

      // A transaction should have been created
      expect(transactionsStore.length).toBe(1);
      expect(transactionsStore[0]?.type).toBe('lent');
      expect(transactionsStore[0]?.amount).toBe(5000);
      expect(transactionsStore[0]?.notes).toContain('Lent to Rahul');

      // The loan_transactions junction should link them
      expect(loanTransactionsStore.length).toBe(1);
      expect(loanTransactionsStore[0]?.event_type).toBe('disbursement');
    });

    it('records a partial repayment, updates outstanding and status', async () => {
      // Setup: create loan manually in store
      const loanId = 'loan-test-1';
      loansStore.push({
        id: loanId,
        user_id: 'user-1',
        counterparty_name: 'Rahul',
        type: 'lent',
        principal_amount: 5000,
        outstanding_amount: 5000,
        status: 'active',
        due_date: '2026-09-01',
        notes: 'For rent deposit',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      });

      const result = await recordRepayment({
        loan_id: loanId,
        amount: 2000,
        date: '2026-08-15',
        notes: 'Repayment from Rahul',
      });

      // Loan should be updated
      expect(result.data).not.toBeNull();
      expect(result.data?.outstanding_amount).toBe(3000);
      expect(result.data?.status).toBe('partially_paid');

      // A repayment transaction should be created as a LOAN event (type 'lent'),
      // NOT income — so it never pollutes income/expense or balance totals.
      const repaymentTxn = transactionsStore.find(
        (t) => t.type === 'lent' && t.amount === 2000 && t.notes === 'Repayment from Rahul',
      );
      expect(repaymentTxn).toBeDefined();
      expect(repaymentTxn?.notes).toBe('Repayment from Rahul');

      // It must NOT be recorded as income/expense
      const incomeTxn = transactionsStore.find((t) => t.type === 'income' || t.type === 'expense');
      expect(incomeTxn).toBeUndefined();

      // Junction record should be created
      const loanTxnLink = loanTransactionsStore.find(
        (lt) => lt.loan_id === loanId && lt.event_type === 'repayment',
      );
      expect(loanTxnLink).toBeDefined();
    });

    it('settles a loan when full outstanding amount is repaid', async () => {
      // Setup: loan with partial repayment already made
      const loanId = 'loan-test-2';
      loansStore.push({
        id: loanId,
        user_id: 'user-1',
        counterparty_name: 'Rahul',
        type: 'lent',
        principal_amount: 5000,
        outstanding_amount: 3000,
        status: 'partially_paid',
        due_date: '2026-09-01',
        notes: null,
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-15T10:00:00Z',
      });

      const result = await recordRepayment({
        loan_id: loanId,
        amount: 3000,
        date: '2026-08-28',
      });

      expect(result.data?.outstanding_amount).toBe(0);
      expect(result.data?.status).toBe('settled');
    });
  });

  describe('Complete Borrow Flow: Create → Repay', () => {
    it('creates a borrowed loan correctly', async () => {
      const result = await createLoan({
        user_id: 'user-1',
        counterparty_name: 'Priya',
        type: 'borrowed',
        principal_amount: 10000,
        outstanding_amount: 10000,
        notes: 'Emergency funds',
      });

      expect(result.data?.type).toBe('borrowed');
      expect(result.data?.counterparty_name).toBe('Priya');

      // Transaction should be of type 'borrowed' (money coming in)
      expect(transactionsStore[0]?.type).toBe('borrowed');
      expect(transactionsStore[0]?.notes).toContain('Borrowed from Priya');
    });

    it('repayment on borrowed loan creates a loan-event transaction (not expense)', async () => {
      const loanId = 'loan-borrowed-1';
      loansStore.push({
        id: loanId,
        user_id: 'user-1',
        counterparty_name: 'Priya',
        type: 'borrowed',
        principal_amount: 10000,
        outstanding_amount: 10000,
        status: 'active',
        due_date: null,
        notes: null,
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      });

      const result = await recordRepayment({
        loan_id: loanId,
        amount: 4000,
        date: '2026-08-20',
      });

      expect(result.data?.outstanding_amount).toBe(6000);
      expect(result.data?.status).toBe('partially_paid');

      // For borrowed loans, repayment is a LOAN event tagged 'borrowed' (money
      // going out), NOT an expense — so it stays out of income/expense totals.
      const repaymentTxn = transactionsStore.find(
        (t) => t.type === 'borrowed' && t.amount === 4000,
      );
      expect(repaymentTxn).toBeDefined();
      expect(repaymentTxn?.notes).toContain('Repaid to Priya');

      // It must NOT be recorded as income/expense
      const incomeExpenseTxn = transactionsStore.find(
        (t) => t.type === 'income' || t.type === 'expense',
      );
      expect(incomeExpenseTxn).toBeUndefined();
    });
  });

  describe('Loan Summary Calculations', () => {
    it('computes net receivable correctly with multiple loans', async () => {
      loansStore = [
        {
          id: 'l1', user_id: 'user-1', type: 'lent',
          principal_amount: 5000, outstanding_amount: 3000, status: 'partially_paid',
        },
        {
          id: 'l2', user_id: 'user-1', type: 'lent',
          principal_amount: 2000, outstanding_amount: 0, status: 'settled',
        },
        {
          id: 'l3', user_id: 'user-1', type: 'borrowed',
          principal_amount: 10000, outstanding_amount: 8000, status: 'active',
        },
      ];

      const result = await getLoanSummary('user-1');
      expect(result.data).not.toBeNull();
      expect(result.data?.totalLent).toBe(7000);
      expect(result.data?.totalBorrowed).toBe(10000);
      expect(result.data?.outstandingLent).toBe(3000);
      expect(result.data?.outstandingBorrowed).toBe(8000);
      expect(result.data?.netReceivable).toBe(-5000);
      expect(result.data?.activeLoansCount).toBe(2);
      expect(result.data?.settledLoansCount).toBe(1);
    });

    it('returns zero summary for user with no loans', async () => {
      loansStore = [];

      const result = await getLoanSummary('user-1');
      expect(result.data?.totalLent).toBe(0);
      expect(result.data?.totalBorrowed).toBe(0);
      expect(result.data?.netReceivable).toBe(0);
      expect(result.data?.activeLoansCount).toBe(0);
    });
  });

  describe('Loan Transaction History', () => {
    it('returns all linked transactions in chronological order', async () => {
      loanTransactionsStore = [
        { id: 'lt-1', loan_id: 'loan-1', transaction_id: 'txn-1', event_type: 'disbursement', created_at: '2026-08-01T10:00:00Z' },
        { id: 'lt-2', loan_id: 'loan-1', transaction_id: 'txn-2', event_type: 'repayment', created_at: '2026-08-15T10:00:00Z' },
        { id: 'lt-3', loan_id: 'loan-1', transaction_id: 'txn-3', event_type: 'repayment', created_at: '2026-08-28T10:00:00Z' },
        // Different loan - should not appear
        { id: 'lt-4', loan_id: 'loan-2', transaction_id: 'txn-4', event_type: 'disbursement', created_at: '2026-08-05T10:00:00Z' },
      ];

      const result = await getLoanTransactions('loan-1');
      expect(result.data).not.toBeNull();
      expect(result.data?.length).toBe(3);
      expect(result.data?.[0]?.event_type).toBe('disbursement');
      expect(result.data?.[1]?.event_type).toBe('repayment');
      expect(result.data?.[2]?.event_type).toBe('repayment');
    });
  });

  describe('Loan Deletion', () => {
    it('deletes a loan and its linked transactions', async () => {
      const loanId = 'loan-del-1';
      loansStore.push({
        id: loanId, user_id: 'user-1', counterparty_name: 'Test',
        type: 'lent', principal_amount: 1000, outstanding_amount: 1000, status: 'active',
      });
      transactionsStore.push(
        { id: 'txn-del-1', user_id: 'user-1', type: 'lent', amount: 1000 },
        { id: 'txn-del-2', user_id: 'user-1', type: 'income', amount: 500 },
        { id: 'txn-unrelated', user_id: 'user-1', type: 'expense', amount: 200 },
      );
      loanTransactionsStore.push(
        { id: 'lt-del-1', loan_id: loanId, transaction_id: 'txn-del-1', event_type: 'disbursement' },
        { id: 'lt-del-2', loan_id: loanId, transaction_id: 'txn-del-2', event_type: 'repayment' },
      );

      const result = await deleteLoan(loanId);
      expect(result.error).toBeNull();

      // Loan should be removed
      expect(loansStore.find((l) => l.id === loanId)).toBeUndefined();

      // Linked transactions should be removed but unrelated ones remain
      expect(transactionsStore.find((t) => t.id === 'txn-del-1')).toBeUndefined();
      expect(transactionsStore.find((t) => t.id === 'txn-del-2')).toBeUndefined();
      expect(transactionsStore.find((t) => t.id === 'txn-unrelated')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('overpayment is capped at outstanding amount', async () => {
      const loanId = 'loan-overpay';
      loansStore.push({
        id: loanId,
        user_id: 'user-1',
        counterparty_name: 'Test',
        type: 'lent',
        principal_amount: 1000,
        outstanding_amount: 500,
        status: 'partially_paid',
        due_date: null,
        notes: null,
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      });

      const result = await recordRepayment({
        loan_id: loanId,
        amount: 9999, // Way more than outstanding
        date: '2026-08-28',
      });

      // Should be capped
      expect(result.data?.outstanding_amount).toBe(0);
      expect(result.data?.status).toBe('settled');

      // Transaction amount should be capped at 500, not 9999.
      // Repayment is a loan event (type 'lent'), never income.
      const repayTxn = transactionsStore.find((t) => t.type === 'lent' && t.notes?.toString().includes('Repayment'));
      expect(repayTxn?.amount).toBe(500);
    });

    it('creating a loan with account_id links to the correct account', async () => {
      const result = await createLoan({
        user_id: 'user-1',
        counterparty_name: 'Amit',
        type: 'lent',
        principal_amount: 3000,
        outstanding_amount: 3000,
        account_id: 'acc-savings-1',
      });

      expect(result.data).not.toBeNull();

      // Transaction should have the account_id
      const txn = transactionsStore.find((t) => t.type === 'lent');
      expect(txn?.account_id).toBe('acc-savings-1');
    });
  });
});

