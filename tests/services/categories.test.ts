import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSystemCategories,
  getUserCategories,
  getHiddenCategories,
  getMergedCategories,
  createUserCategory,
  updateUserCategory,
  deleteUserCategory,
  hideSystemCategory,
  restoreSystemCategory,
  copySystemCategory,
  getHiddenSystemCategories,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categories';

// ---------- Supabase mock ----------

// Build a fully-chainable mock: every method returns the chain itself,
// AND every method is also a thenable (resolves with terminalValue)
// so Supabase's `await chain.eq(...).eq(...)` pattern works.
function buildChain(terminalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: ReturnType<typeof vi.fn> } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'is', 'in'];
  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation(() => chain);
  }
  // Make the chain thenable so `await` resolves with terminalValue
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalValue).then(resolve);
  });
  return chain;
}

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

describe('categories service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------- getSystemCategories ---------------

  describe('getSystemCategories', () => {
    it('returns system categories', async () => {
      const cats = [{ id: '1', name: 'Food', type: 'expense' }];
      mockFrom.mockReturnValue(buildChain({ data: cats, error: null }));

      const result = await getSystemCategories();
      expect(result.data).toEqual(cats);
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('system_categories');
    });

    it('filters by type when provided', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getSystemCategories('expense');
      expect(chain.eq).toHaveBeenCalledWith('type', 'expense');
    });
  });

  // --------------- getUserCategories ---------------

  describe('getUserCategories', () => {
    it('returns user categories excluding soft-deleted', async () => {
      const cats = [{ id: '1', name: 'Custom', user_id: 'u1' }];
      const chain = buildChain({ data: cats, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getUserCategories('u1');
      expect(result.data).toEqual(cats);
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'u1');
      expect(chain.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('filters by type', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getUserCategories('u1', 'income');
      expect(chain.eq).toHaveBeenCalledWith('type', 'income');
    });
  });

  // --------------- getHiddenCategories ---------------

  describe('getHiddenCategories', () => {
    it('returns hidden category records', async () => {
      const hidden = [{ user_id: 'u1', category_id: 'c1', hidden_at: '2024-01-01' }];
      mockFrom.mockReturnValue(buildChain({ data: hidden, error: null }));

      const result = await getHiddenCategories('u1');
      expect(result.data).toEqual(hidden);
      expect(mockFrom).toHaveBeenCalledWith('user_hidden_categories');
    });
  });

  // --------------- getMergedCategories ---------------

  describe('getMergedCategories', () => {
    it('merges system and user categories, excluding hidden', async () => {
      const systemCats = [
        { id: 's1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils' },
        { id: 's2', name: 'Salary', type: 'income', color: '#0f0', icon: 'dollar' },
      ];
      const userCats = [
        { id: 'u1', name: 'Custom', type: 'expense', color: '#00f', icon: 'tag', source_category_id: null },
      ];
      const hiddenCats = [{ user_id: 'user1', category_id: 's2', hidden_at: '2024-01-01' }];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'system_categories') return buildChain({ data: systemCats, error: null });
        if (table === 'user_categories') return buildChain({ data: userCats, error: null });
        return buildChain({ data: hiddenCats, error: null });
      });

      const result = await getMergedCategories('user1');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      const names = result.data?.map((c) => c.name);
      expect(names).toContain('Food');
      expect(names).toContain('Custom');
      expect(names).not.toContain('Salary');
    });

    it('returns error if system categories fetch fails', async () => {
      const error = { message: 'DB error' };
      mockFrom.mockImplementation((table: string) => {
        if (table === 'system_categories') return buildChain({ data: null, error });
        if (table === 'user_categories') return buildChain({ data: [], error: null });
        return buildChain({ data: [], error: null });
      });

      const result = await getMergedCategories('user1');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });

    it('returns error if user categories fetch fails', async () => {
      const error = { message: 'User cats error' };
      mockFrom.mockImplementation((table: string) => {
        if (table === 'system_categories') return buildChain({ data: [], error: null });
        if (table === 'user_categories') return buildChain({ data: null, error });
        return buildChain({ data: [], error: null });
      });

      const result = await getMergedCategories('user1');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });

    it('returns error if hidden categories fetch fails', async () => {
      const error = { message: 'Hidden error' };
      mockFrom.mockImplementation((table: string) => {
        if (table === 'system_categories') return buildChain({ data: [], error: null });
        if (table === 'user_categories') return buildChain({ data: [], error: null });
        return buildChain({ data: null, error });
      });

      const result = await getMergedCategories('user1');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  // --------------- hideSystemCategory ---------------

  describe('hideSystemCategory', () => {
    it('inserts into user_hidden_categories', async () => {
      const chain = buildChain({ error: null });
      mockFrom.mockReturnValue(chain);

      const result = await hideSystemCategory('user1', 'cat1');
      expect(result.error).toBeNull();
      expect(chain.insert).toHaveBeenCalledWith({ user_id: 'user1', category_id: 'cat1' });
    });
  });

  // --------------- restoreSystemCategory ---------------

  describe('restoreSystemCategory', () => {
    it('deletes from user_hidden_categories', async () => {
      mockFrom.mockReturnValue(buildChain({ error: null }));

      const result = await restoreSystemCategory('user1', 'cat1');
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('user_hidden_categories');
    });
  });

  // --------------- copySystemCategory ---------------

  describe('copySystemCategory', () => {
    it('copies a system category as user category', async () => {
      const systemCat = { id: 's1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils' };
      const newCat = { id: 'u1', name: 'Food (Copy)', type: 'expense', color: '#f00', icon: 'utensils' };

      let callIdx = 0;
      mockFrom.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return buildChain({ data: systemCat, error: null });
        return buildChain({ data: newCat, error: null });
      });

      const result = await copySystemCategory('user1', 's1');
      expect(result.data).toEqual(newCat);
      expect(result.error).toBeNull();
    });

    it('returns error if system category not found', async () => {
      mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

      const result = await copySystemCategory('user1', 'nonexistent');
      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('returns error if fetch fails', async () => {
      const error = { message: 'Not found' };
      mockFrom.mockReturnValue(buildChain({ data: null, error }));

      const result = await copySystemCategory('user1', 's1');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  // --------------- getHiddenSystemCategories ---------------

  describe('getHiddenSystemCategories', () => {
    it('returns hidden system categories with merged format', async () => {
      const hidden = [{ category_id: 's1' }, { category_id: 's2' }];
      const cats = [
        { id: 's1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils' },
        { id: 's2', name: 'Salary', type: 'income', color: '#0f0', icon: 'dollar' },
      ];

      let callIdx = 0;
      mockFrom.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return buildChain({ data: hidden, error: null });
        return buildChain({ data: cats, error: null });
      });

      const result = await getHiddenSystemCategories('user1');
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]?.source).toBe('system');
      expect(result.data?.[0]?.isDefault).toBe(true);
      expect(result.data?.[0]?.editable).toBe(false);
      expect(result.error).toBeNull();
    });

    it('returns empty array when no categories hidden', async () => {
      mockFrom.mockReturnValue(buildChain({ data: [], error: null }));

      const result = await getHiddenSystemCategories('user1');
      expect(result.data).toEqual([]);
    });

    it('returns empty when hidden data is null', async () => {
      mockFrom.mockReturnValue(buildChain({ data: null, error: null }));

      const result = await getHiddenSystemCategories('user1');
      expect(result.data).toEqual([]);
    });

    it('returns error when hidden fetch fails', async () => {
      const error = { message: 'DB error' };
      mockFrom.mockReturnValue(buildChain({ data: null, error }));

      const result = await getHiddenSystemCategories('user1');
      expect(result.data).toEqual([]);
      expect(result.error).toEqual(error);
    });

    it('returns error when system categories fetch fails', async () => {
      const hidden = [{ category_id: 's1' }];
      const error = { message: 'System error' };

      let callIdx = 0;
      mockFrom.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return buildChain({ data: hidden, error: null });
        return buildChain({ data: null, error });
      });

      const result = await getHiddenSystemCategories('user1');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  // --------------- createUserCategory ---------------

  describe('createUserCategory', () => {
    it('creates and returns category', async () => {
      const cat = { id: '1', name: 'New', type: 'expense' };
      mockFrom.mockReturnValue(buildChain({ data: cat, error: null }));

      const result = await createUserCategory({ user_id: 'u1', name: '  New  ', type: 'expense', color: '#000', icon: 'tag' });
      expect(result.data).toEqual(cat);
    });

    it('returns error on failure', async () => {
      const error = { message: 'Duplicate' };
      mockFrom.mockReturnValue(buildChain({ data: null, error }));

      const result = await createUserCategory({ user_id: 'u1', name: 'Dup', type: 'expense', color: '#000', icon: 'tag' });
      expect(result.error).toEqual(error);
    });
  });

  // --------------- updateUserCategory ---------------

  describe('updateUserCategory', () => {
    it('updates and returns category', async () => {
      const cat = { id: '1', name: 'Updated' };
      mockFrom.mockReturnValue(buildChain({ data: cat, error: null }));

      const result = await updateUserCategory('1', 'user-1', { name: 'Updated' });
      expect(result.data).toEqual(cat);
    });
  });

  // --------------- deleteUserCategory ---------------

  describe('deleteUserCategory', () => {
    it('soft-deletes', async () => {
      mockFrom.mockReturnValue(buildChain({ error: null }));

      const result = await deleteUserCategory('1', 'user-1');
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const error = { message: 'Cannot delete' };
      mockFrom.mockReturnValue(buildChain({ error }));

      const result = await deleteUserCategory('1', 'user-1');
      expect(result.error).toEqual(error);
    });
  });

  // --------------- Backward Compatibility ---------------

  describe('backward compatibility wrappers', () => {
    it('getCategories is a function', () => {
      expect(typeof getCategories).toBe('function');
    });

    it('createCategory creates via user_categories', async () => {
      const cat = { id: '1', name: 'New' };
      mockFrom.mockReturnValue(buildChain({ data: cat, error: null }));

      const result = await createCategory({ user_id: 'u1', name: 'New', type: 'expense', color: '#000', icon: 'tag' });
      expect(result.data).toEqual(cat);
    });

    it('updateCategory updates user_categories', async () => {
      const cat = { id: '1', name: 'Updated' };
      mockFrom.mockReturnValue(buildChain({ data: cat, error: null }));

      const result = await updateCategory('1', { name: 'Updated' });
      expect(result.data).toEqual(cat);
    });

    it('deleteCategory soft-deletes', async () => {
      mockFrom.mockReturnValue(buildChain({ error: null }));

      const result = await deleteCategory('1');
      expect(result.error).toBeNull();
    });
  });
});
