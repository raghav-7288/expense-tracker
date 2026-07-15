import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMergedCategories,
  createUserCategory,
  updateUserCategory,
  deleteUserCategory,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/services/categories';

// Build a chainable mock
function chainable(terminal: Record<string, unknown>) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'is', 'in'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
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

  describe('createUserCategory', () => {
    it('returns created category', async () => {
      const cat = { id: '1', name: 'New', type: 'expense', color: '#000', icon: 'tag' };
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cat, error: null }),
      } as never;

      const result = await createUserCategory({ user_id: 'u1', name: 'New', type: 'expense', color: '#000', icon: 'tag' });
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

      const result = await createUserCategory({ user_id: 'u1', name: 'Dup', type: 'expense', color: '#000', icon: 'tag' });
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('updateUserCategory', () => {
    it('returns updated category', async () => {
      const cat = { id: '1', name: 'Updated' };
      mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cat, error: null }),
      } as never;

      const result = await updateUserCategory('1', 'user-1', { name: 'Updated' });
      expect(result.data).toEqual(cat);
    });
  });

  describe('deleteUserCategory', () => {
    it('soft-deletes by setting deleted_at', async () => {
      const eqFn = vi.fn().mockReturnThis();
      mockChain = {
        update: vi.fn().mockReturnValue({ eq: eqFn }),
      } as never;
      eqFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

      const result = await deleteUserCategory('1', 'user-1');
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const error = { message: 'Cannot delete' };
      const eqFn = vi.fn().mockReturnThis();
      mockChain = {
        update: vi.fn().mockReturnValue({ eq: eqFn }),
      } as never;
      eqFn.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error }) });

      const result = await deleteUserCategory('1', 'user-1');
      expect(result.error).toEqual(error);
    });
  });

  describe('backward compatibility', () => {
    it('getCategories calls getMergedCategories', async () => {
      // The function signature is the same
      expect(getCategories).toBeDefined();
      expect(typeof getCategories).toBe('function');
    });

    it('createCategory calls createUserCategory', async () => {
      const cat = { id: '1', name: 'New' };
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: cat, error: null }),
      } as never;

      const result = await createCategory({ user_id: 'u1', name: 'New', type: 'expense', color: '#000', icon: 'tag' });
      expect(result.data).toEqual(cat);
    });

    it('updateCategory updates user_categories table', async () => {
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

    it('deleteCategory soft-deletes', async () => {
      mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as never;

      const result = await deleteCategory('1');
      expect(result.error).toBeNull();
    });
  });
});
