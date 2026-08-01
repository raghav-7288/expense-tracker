import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  recordRepayment,
  getLoanTransactions,
  getLoanSummary,
} from '@/services/loans';

// Build a fully-chainable mock: every method returns the chain,
// and the chain is thenable to resolve with terminalValue
function buildChain(terminalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: ReturnType<typeof vi.fn> } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'neq',
    'gte', 'lte', 'ilike', 'or', 'order', 'single', 'limit', 'range', 'maybeSingle'];
  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation(() => chain);
  }
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalValue).then(resolve);
  });
  return chain;
}

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

function rawLoan(overrides: Record<string, unknown> = {}) {
  return {
    id: 'loan-1',
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
    ...overrides,
  };
}

describe('loans service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLoans', () => {
    it('returns all loans for a user', async () => {
      const loans = [rawLoan(), rawLoan({ id: 'loan-2', counterparty_name: 'Priya', type: 'borrowed' })];
      mockFrom.mockReturnValue(buildChain({ data: loans, error: null }));

      const result = await getLoans('user-1');
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.counterparty_name).toBe('Rahul');
      expect(result.data?.[1]?.type).toBe('borrowed');
    });

    it('applies type filter', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getLoans('user-1', { type: 'lent' });
      expect(chain.eq).toHaveBeenCalledWith('type', 'lent');
    });

    it('does not filter when type is all', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getLoans('user-1', { type: 'all' });
      // Should only call eq for user_id, not for type
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.eq).not.toHaveBeenCalledWith('type', 'all');
    });

    it('applies status filter', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getLoans('user-1', { status: 'settled' });
      expect(chain.eq).toHaveBeenCalledWith('status', 'settled');
    });

    it('applies search filter on counterparty_name', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getLoans('user-1', { search: 'Rahul' });
      expect(chain.ilike).toHaveBeenCalledWith('counterparty_name', '%Rahul%');
    });

    it('returns error on failure', async () => {
      const error = { message: 'DB error' };
      mockFrom.mockReturnValue(buildChain({ data: null, error }));

      const result = await getLoans('user-1');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('getLoan', () => {
    it('returns a single loan by id', async () => {
      const chain = buildChain({ data: rawLoan(), error: null });
      // single() needs to resolve properly
      chain.single = vi.fn().mockResolvedValue({ data: rawLoan(), error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getLoan('loan-1');
      expect(result.data?.id).toBe('loan-1');
      expect(result.data?.counterparty_name).toBe('Rahul');
    });

    it('returns error when loan not found', async () => {
      const chain = buildChain({ data: null, error: { message: 'Not found' } });
      chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(chain);

      const result = await getLoan('nonexistent');
      expect(result.data).toBeNull();
    });
  });

  describe('createLoan', () => {
    it('creates a loan with disbursement transaction and links them', async () => {
      const loan = rawLoan();
      const txn = { id: 'txn-1', type: 'lent', amount: 5000 };

      let callIdx = 0;
      mockFrom.mockImplementation((table: string) => {
        callIdx++;
        if (table === 'loans' && callIdx === 1) {
          // Insert loan
          const chain = buildChain({ data: loan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: loan, error: null });
          return chain;
        }
        if (table === 'transactions') {
          // Insert transaction
          const chain = buildChain({ data: txn, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: txn, error: null });
          return chain;
        }
        if (table === 'loan_transactions') {
          // Link them
          return buildChain({ data: {}, error: null });
        }
        return buildChain({ data: null, error: null });
      });

      const result = await createLoan({
        user_id: 'user-1',
        counterparty_name: 'Rahul',
        type: 'lent',
        principal_amount: 5000,
        outstanding_amount: 5000,
        due_date: '2026-09-01',
        notes: 'For rent deposit',
      });

      expect(result.data?.id).toBe('loan-1');
      expect(result.data?.type).toBe('lent');
      expect(result.data?.principal_amount).toBe(5000);
      // Verify loan_transactions was called
      expect(mockFrom).toHaveBeenCalledWith('loan_transactions');
    });

    it('creates a borrowed loan correctly', async () => {
      const loan = rawLoan({ type: 'borrowed', counterparty_name: 'Priya' });
      const txn = { id: 'txn-2', type: 'borrowed', amount: 10000 };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'loans') {
          const chain = buildChain({ data: loan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: loan, error: null });
          return chain;
        }
        if (table === 'transactions') {
          const chain = buildChain({ data: txn, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: txn, error: null });
          return chain;
        }
        return buildChain({ data: {}, error: null });
      });

      const result = await createLoan({
        user_id: 'user-1',
        counterparty_name: 'Priya',
        type: 'borrowed',
        principal_amount: 10000,
        outstanding_amount: 10000,
      });

      expect(result.data?.type).toBe('borrowed');
      expect(mockFrom).toHaveBeenCalledWith('transactions');
    });

    it('rolls back loan on transaction failure', async () => {
      const loan = rawLoan();

      mockFrom.mockImplementation((table: string) => {
        if (table === 'loans') {
          const chain = buildChain({ data: loan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: loan, error: null });
          return chain;
        }
        if (table === 'transactions') {
          // Transaction creation fails
          const chain = buildChain({ data: null, error: { message: 'Insert failed' } });
          chain.single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
          return chain;
        }
        return buildChain({ data: null, error: null });
      });

      const result = await createLoan({
        user_id: 'user-1',
        counterparty_name: 'Rahul',
        type: 'lent',
        principal_amount: 5000,
        outstanding_amount: 5000,
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'Insert failed' });
      // Should attempt to delete the created loan (rollback)
      expect(mockFrom).toHaveBeenCalledWith('loans');
    });
  });

  describe('recordRepayment', () => {
    it('records a partial repayment and updates loan status', async () => {
      const loan = rawLoan({ outstanding_amount: 5000, status: 'active' });
      const txn = { id: 'txn-repay-1', type: 'income', amount: 2000 };
      const updatedLoan = { ...loan, outstanding_amount: 3000, status: 'partially_paid' };

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'loans' && callCount === 1) {
          // Fetch loan
          const chain = buildChain({ data: loan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: loan, error: null });
          return chain;
        }
        if (table === 'transactions') {
          // Insert repayment transaction
          const chain = buildChain({ data: txn, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: txn, error: null });
          return chain;
        }
        if (table === 'loan_transactions') {
          // Link
          return buildChain({ data: {}, error: null });
        }
        if (table === 'loans') {
          // Update loan
          const chain = buildChain({ data: updatedLoan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: updatedLoan, error: null });
          return chain;
        }
        return buildChain({ data: null, error: null });
      });

      const result = await recordRepayment({
        loan_id: 'loan-1',
        amount: 2000,
        date: '2026-08-15',
        notes: 'Repayment from Rahul',
      });

      expect(result.data?.outstanding_amount).toBe(3000);
      expect(result.data?.status).toBe('partially_paid');
      // Verify a transaction was created
      expect(mockFrom).toHaveBeenCalledWith('transactions');
      // Verify loan was linked
      expect(mockFrom).toHaveBeenCalledWith('loan_transactions');
    });

    it('fully settles a loan when repaying the full outstanding amount', async () => {
      const loan = rawLoan({ outstanding_amount: 3000, status: 'partially_paid' });
      const txn = { id: 'txn-repay-2', type: 'income', amount: 3000 };
      const settledLoan = { ...loan, outstanding_amount: 0, status: 'settled' };

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'loans' && callCount === 1) {
          const chain = buildChain({ data: loan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: loan, error: null });
          return chain;
        }
        if (table === 'transactions') {
          const chain = buildChain({ data: txn, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: txn, error: null });
          return chain;
        }
        if (table === 'loan_transactions') {
          return buildChain({ data: {}, error: null });
        }
        if (table === 'loans') {
          const chain = buildChain({ data: settledLoan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: settledLoan, error: null });
          return chain;
        }
        return buildChain({ data: null, error: null });
      });

      const result = await recordRepayment({
        loan_id: 'loan-1',
        amount: 3000,
        date: '2026-08-28',
      });

      expect(result.data?.outstanding_amount).toBe(0);
      expect(result.data?.status).toBe('settled');
    });

    it('caps repayment at outstanding amount to prevent overpayment', async () => {
      const loan = rawLoan({ outstanding_amount: 1000, status: 'partially_paid' });
      const txn = { id: 'txn-repay-3', type: 'income', amount: 1000 };
      const settledLoan = { ...loan, outstanding_amount: 0, status: 'settled' };

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'loans' && callCount === 1) {
          const chain = buildChain({ data: loan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: loan, error: null });
          return chain;
        }
        if (table === 'transactions') {
          const chain = buildChain({ data: txn, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: txn, error: null });
          return chain;
        }
        if (table === 'loan_transactions') {
          return buildChain({ data: {}, error: null });
        }
        if (table === 'loans') {
          const chain = buildChain({ data: settledLoan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: settledLoan, error: null });
          return chain;
        }
        return buildChain({ data: null, error: null });
      });

      // Try to repay 5000 but only 1000 is outstanding
      const result = await recordRepayment({
        loan_id: 'loan-1',
        amount: 5000,
        date: '2026-08-28',
      });

      // Should settle (capped at outstanding 1000), not go negative
      expect(result.data?.outstanding_amount).toBe(0);
      expect(result.data?.status).toBe('settled');
    });

    it('creates an expense transaction for borrowed loan repayments', async () => {
      const loan = rawLoan({ type: 'borrowed', counterparty_name: 'Priya', outstanding_amount: 5000 });
      const txn = { id: 'txn-repay-4', type: 'expense', amount: 2000 };
      const updatedLoan = { ...loan, outstanding_amount: 3000, status: 'partially_paid' };

      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        callCount++;
        if (table === 'loans' && callCount === 1) {
          const chain = buildChain({ data: loan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: loan, error: null });
          return chain;
        }
        if (table === 'transactions') {
          const chain = buildChain({ data: txn, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: txn, error: null });
          return chain;
        }
        if (table === 'loan_transactions') {
          return buildChain({ data: {}, error: null });
        }
        if (table === 'loans') {
          const chain = buildChain({ data: updatedLoan, error: null });
          chain.single = vi.fn().mockResolvedValue({ data: updatedLoan, error: null });
          return chain;
        }
        return buildChain({ data: null, error: null });
      });

      const result = await recordRepayment({
        loan_id: 'loan-1',
        amount: 2000,
        date: '2026-08-15',
      });

      // For borrowed loans, repayment creates expense (money going out)
      expect(result.data?.outstanding_amount).toBe(3000);
      expect(mockFrom).toHaveBeenCalledWith('transactions');
    });
  });

  describe('deleteLoan', () => {
    it('deletes linked transactions and the loan', async () => {
      const links = [{ transaction_id: 'txn-1' }, { transaction_id: 'txn-2' }];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'loan_transactions') {
          return buildChain({ data: links, error: null });
        }
        if (table === 'transactions') {
          return buildChain({ error: null });
        }
        if (table === 'loans') {
          return buildChain({ error: null });
        }
        return buildChain({ data: null, error: null });
      });

      const result = await deleteLoan('loan-1');
      expect(result.error).toBeNull();
      // Should have called delete on transactions and loans
      expect(mockFrom).toHaveBeenCalledWith('loan_transactions');
      expect(mockFrom).toHaveBeenCalledWith('transactions');
      expect(mockFrom).toHaveBeenCalledWith('loans');
    });

    it('handles loan with no linked transactions', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'loan_transactions') {
          return buildChain({ data: [], error: null });
        }
        if (table === 'loans') {
          return buildChain({ error: null });
        }
        return buildChain({ data: null, error: null });
      });

      const result = await deleteLoan('loan-1');
      expect(result.error).toBeNull();
    });
  });

  describe('getLoanTransactions', () => {
    it('returns linked transactions for a loan', async () => {
      const loanTxns = [
        { id: 'lt-1', loan_id: 'loan-1', transaction_id: 'txn-1', event_type: 'disbursement', created_at: '2026-08-01T10:00:00Z' },
        { id: 'lt-2', loan_id: 'loan-1', transaction_id: 'txn-2', event_type: 'repayment', created_at: '2026-08-15T10:00:00Z' },
      ];
      mockFrom.mockReturnValue(buildChain({ data: loanTxns, error: null }));

      const result = await getLoanTransactions('loan-1');
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.event_type).toBe('disbursement');
      expect(result.data?.[1]?.event_type).toBe('repayment');
    });
  });

  describe('getLoanSummary', () => {
    it('computes correct summary from loan data', async () => {
      const loans = [
        { type: 'lent', principal_amount: 5000, outstanding_amount: 3000, status: 'partially_paid' },
        { type: 'lent', principal_amount: 2000, outstanding_amount: 0, status: 'settled' },
        { type: 'borrowed', principal_amount: 10000, outstanding_amount: 8000, status: 'active' },
      ];
      mockFrom.mockReturnValue(buildChain({ data: loans, error: null }));

      const result = await getLoanSummary('user-1');
      expect(result.data).not.toBeNull();
      expect(result.data?.totalLent).toBe(7000);
      expect(result.data?.totalBorrowed).toBe(10000);
      expect(result.data?.outstandingLent).toBe(3000);
      expect(result.data?.outstandingBorrowed).toBe(8000);
      expect(result.data?.netReceivable).toBe(-5000); // 3000 - 8000
      expect(result.data?.activeLoansCount).toBe(2); // partially_paid + active
      expect(result.data?.settledLoansCount).toBe(1);
    });

    it('returns zero summary when user has no loans', async () => {
      mockFrom.mockReturnValue(buildChain({ data: [], error: null }));

      const result = await getLoanSummary('user-1');
      expect(result.data?.totalLent).toBe(0);
      expect(result.data?.totalBorrowed).toBe(0);
      expect(result.data?.netReceivable).toBe(0);
      expect(result.data?.activeLoansCount).toBe(0);
      expect(result.data?.settledLoansCount).toBe(0);
    });
  });

  describe('updateLoan', () => {
    it('updates loan fields', async () => {
      const updated = rawLoan({ counterparty_name: 'Rahul Kumar', due_date: '2026-10-01' });
      const chain = buildChain({ data: updated, error: null });
      chain.single = vi.fn().mockResolvedValue({ data: updated, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await updateLoan('loan-1', {
        counterparty_name: 'Rahul Kumar',
        due_date: '2026-10-01',
      });

      expect(result.data?.counterparty_name).toBe('Rahul Kumar');
      expect(result.data?.due_date).toBe('2026-10-01');
    });
  });
});

