import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAccounts, getActiveAccounts, getAccount, createAccount, updateAccount, deleteAccount, getAccountBalance, getAllAccountBalances } from '@/services/accounts';

function buildChain(terminalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: ReturnType<typeof vi.fn> } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'or', 'gte', 'lte', 'not', 'order', 'single', 'maybeSingle'];
  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation(() => chain);
  }
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalValue).then(resolve);
  });
  return chain;
}

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

function buildAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: 'acc-1',
    user_id: 'user-1',
    name: 'Savings',
    type: 'savings',
    initial_balance: 10000,
    color: '#3b82f6',
    icon: 'wallet',
    is_active: true,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('accounts service', () => {
  describe('getAccounts', () => {
    it('fetches all accounts for a user ordered by sort_order', async () => {
      const accounts = [buildAccount(), buildAccount({ id: 'acc-2', name: 'Checking' })];
      const chain = buildChain({ data: accounts, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getAccounts('user-1');

      expect(mockFrom).toHaveBeenCalledWith('accounts');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.order).toHaveBeenCalledWith('sort_order', { ascending: true });
      expect(result.data).toEqual(accounts);
      expect(result.error).toBeNull();
    });

    it('returns error when fetch fails', async () => {
      const error = { message: 'Network error' };
      const chain = buildChain({ data: null, error });
      mockFrom.mockReturnValue(chain);

      const result = await getAccounts('user-1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('getActiveAccounts', () => {
    it('fetches only active accounts', async () => {
      const accounts = [buildAccount()];
      const chain = buildChain({ data: accounts, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getActiveAccounts('user-1');

      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(result.data).toEqual(accounts);
    });
  });

  describe('getAccount', () => {
    it('fetches single account by id', async () => {
      const account = buildAccount();
      const chain = buildChain({ data: account, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getAccount('acc-1');

      expect(chain.eq).toHaveBeenCalledWith('id', 'acc-1');
      expect(chain.single).toHaveBeenCalled();
      expect(result.data).toEqual(account);
    });
  });

  describe('createAccount', () => {
    it('inserts account with required fields', async () => {
      const account = buildAccount();
      const chain = buildChain({ data: account, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await createAccount({
        user_id: 'user-1',
        name: 'Savings',
        type: 'savings',
        initial_balance: 10000,
        color: '#3b82f6',
        icon: 'wallet',
      });

      expect(chain.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        name: 'Savings',
        type: 'savings',
        initial_balance: 10000,
        color: '#3b82f6',
        icon: 'wallet',
      });
      expect(result.data).toEqual(account);
    });

    it('uses default color and icon when not provided', async () => {
      const account = buildAccount();
      const chain = buildChain({ data: account, error: null });
      mockFrom.mockReturnValue(chain);

      await createAccount({
        user_id: 'user-1',
        name: 'Cash',
        type: 'cash',
        initial_balance: 500,
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          color: '#3b82f6',
          icon: 'wallet',
        }),
      );
    });
  });

  describe('updateAccount', () => {
    it('updates account fields', async () => {
      const account = buildAccount({ name: 'Updated' });
      const chain = buildChain({ data: account, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await updateAccount('acc-1', { name: 'Updated' });

      expect(chain.update).toHaveBeenCalledWith({ name: 'Updated' });
      expect(chain.eq).toHaveBeenCalledWith('id', 'acc-1');
      expect(result.data).toEqual(account);
    });
  });

  describe('deleteAccount', () => {
    it('deletes account by id', async () => {
      const chain = buildChain({ error: null });
      mockFrom.mockReturnValue(chain);

      const result = await deleteAccount('acc-1');

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'acc-1');
      expect(result.error).toBeNull();
    });
  });

  describe('getAccountBalance', () => {
    it('computes balance from initial + income - expenses', async () => {
      const accountChain = buildChain({ data: { initial_balance: 10000 }, error: null });
      const incomeChain = buildChain({ data: [{ amount: 5000 }, { amount: 3000 }], error: null });
      const expenseChain = buildChain({ data: [{ amount: 2000 }], error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return accountChain;
        if (callCount === 2) return incomeChain;
        return expenseChain;
      });

      const result = await getAccountBalance('acc-1');

      // 10000 + 5000 + 3000 - 2000 = 16000
      expect(result.balance).toBe(16000);
      expect(result.error).toBeNull();
    });

    it('returns 0 when account not found', async () => {
      const chain = buildChain({ data: null, error: { message: 'Not found' } });
      mockFrom.mockReturnValue(chain);

      const result = await getAccountBalance('nonexistent');

      expect(result.balance).toBe(0);
    });
  });

  describe('getAllAccountBalances', () => {
    it('computes balances for all active accounts via RPC', async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            account_id: 'acc-1',
            account_name: 'Savings',
            account_type: 'savings',
            initial_balance: 10000,
            color: '#3b82f6',
            icon: 'wallet',
            is_active: true,
            sort_order: 0,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            computed_balance: 11500,
          },
          {
            account_id: 'acc-2',
            account_name: 'Checking',
            account_type: 'checking',
            initial_balance: 5000,
            color: '#3b82f6',
            icon: 'wallet',
            is_active: true,
            sort_order: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            computed_balance: 4000,
          },
        ],
        error: null,
      });

      const result = await getAllAccountBalances('user-1');

      expect(result.data).toHaveLength(2);
      // acc-1: computed_balance = 11500
      expect(result.data![0]!.balance).toBe(11500);
      // acc-2: computed_balance = 4000
      expect(result.data![1]!.balance).toBe(4000);
      expect(mockRpc).toHaveBeenCalledWith('get_account_balances', { uid: 'user-1' });
    });

    it('returns null when RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });

      const result = await getAllAccountBalances('user-1');

      expect(result.data).toBeNull();
    });
  });
});

