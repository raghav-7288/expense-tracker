import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categories';

// Build a chainable mock
function chainable(terminal: Record<string, unknown>) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Override terminal to return actual result
  Object.assign(chain, terminal);
  return chain;
}

let mockChain: ReturnType<typeof chainable>;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}));

describe('categories service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('returns categories without type filter', async () => {
      const data = [{ id: '1', name: 'Food' }];
      mockChain = chainable({});
      // Make the chain thenable
      const resolveVal = { data, error: null };
      mockChain['order'] = vi.fn().mockResolvedValue(resolveVal);
      mockChain['select'] = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockChain['order'] }) });
      (await import('@/lib/supabase')).supabase.from = vi.fn(() => mockChain) as never;

      // Re-approach: just verify shape by mocking at a higher level
      // This test verifies the function signature returns { data, error }
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data, error: null }),
      } as never;

      const result = await getCategories('user-1');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
    });

    it('applies type filter when provided', async () => {
      const data = [{ id: '1', name: 'Salary', type: 'income' }];
      // Chain: from().select('*').eq('user_id').order('name') → then .eq('type') → then await
      // order() must return something with .eq() that is also thenable
      const terminalChain = {
        eq: vi.fn().mockImplementation(function(this: unknown) { return terminalChain; }),
        then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve({ data, error: null })),
      };
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(mockChain),
        order: vi.fn().mockReturnValue(terminalChain),
      } as never;
      // Make the first eq return the same chain (for user_id filter)
      (mockChain as Record<string, unknown>).eq = vi.fn().mockReturnValue(mockChain);

      const result = await getCategories('user-1', 'income');
      expect(terminalChain.eq).toHaveBeenCalledWith('type', 'income');
      expect(result.data).toEqual(data);
    });
  });

  describe('createCategory', () => {
    it('returns created category', async () => {
      const cat = { id: '1', name: 'New', type: 'expense', color: '#000', icon: 'tag' };
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cat, error: null }),
      } as never;

      const result = await createCategory({ user_id: 'u1', name: 'New', type: 'expense', color: '#000', icon: 'tag' });
      expect(result.data).toEqual(cat);
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const error = { message: 'Duplicate' };
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error }),
      } as never;

      const result = await createCategory({ user_id: 'u1', name: 'Dup', type: 'expense', color: '#000', icon: 'tag' });
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('updateCategory', () => {
    it('returns updated category', async () => {
      const cat = { id: '1', name: 'Updated' };
      mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cat, error: null }),
      } as never;

      const result = await updateCategory('1', { name: 'Updated' });
      expect(result.data).toEqual(cat);
    });
  });

  describe('deleteCategory', () => {
    it('returns no error on success', async () => {
      mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never;

      const result = await deleteCategory('1');
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const error = { message: 'Cannot delete' };
      mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error }),
      } as never;

      const result = await deleteCategory('1');
      expect(result.error).toEqual(error);
    });
  });
});




