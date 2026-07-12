import { describe, it, expect } from 'vitest';
import { queryKeys } from '@/lib/queryKeys';

describe('queryKeys', () => {
  describe('transactions', () => {
    it('all returns base key', () => {
      expect(queryKeys.transactions.all).toEqual(['transactions']);
    });

    it('list includes userId and filters', () => {
      const key = queryKeys.transactions.list('user-1', { type: 'income' });
      expect(key).toEqual(['transactions', 'user-1', { type: 'income' }]);
    });

    it('list with undefined userId', () => {
      const key = queryKeys.transactions.list(undefined);
      expect(key).toEqual(['transactions', undefined, undefined]);
    });
  });

  describe('categories', () => {
    it('all returns base key', () => {
      expect(queryKeys.categories.all).toEqual(['categories']);
    });

    it('list includes userId and optional type', () => {
      const key = queryKeys.categories.list('user-1', 'expense');
      expect(key).toEqual(['categories', 'user-1', 'expense']);
    });
  });

  describe('profile', () => {
    it('detail includes userId', () => {
      const key = queryKeys.profile.detail('user-1');
      expect(key).toEqual(['profile', 'user-1']);
    });
  });

  describe('dashboard', () => {
    it('all returns base key', () => {
      expect(queryKeys.dashboard.all).toEqual(['dashboard']);
    });

    it('stats includes userId', () => {
      expect(queryKeys.dashboard.stats('u1')).toEqual(['dashboard', 'stats', 'u1']);
    });

    it('recent includes userId and limit', () => {
      expect(queryKeys.dashboard.recent('u1', 5)).toEqual(['dashboard', 'recent', 'u1', 5]);
    });

    it('monthly includes userId and year', () => {
      expect(queryKeys.dashboard.monthly('u1', 2024)).toEqual(['dashboard', 'monthly', 'u1', 2024]);
    });

    it('categories includes userId', () => {
      expect(queryKeys.dashboard.categories('u1')).toEqual(['dashboard', 'categories', 'u1']);
    });
  });
});

