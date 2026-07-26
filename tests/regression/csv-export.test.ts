/**
 * Regression tests for CSV export/import — ensures special characters
 * are properly escaped per RFC 4180.
 */
import { describe, it, expect } from 'vitest';
import { generateCSV } from '@/engines/analytics';
import type { Transaction } from '@/types';

function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    user_id: 'u1',
    category_id: 'c1',
    account_id: null,
    type: 'expense',
    amount: 100,
    notes: 'Test',
    date: '2026-07-01',
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    categories: { id: 'c1', user_id: 'u1', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' },
    account: null,
    ...overrides,
  };
}

describe('CSV Export Regression', () => {
  it('does not quote plain text fields without special characters', () => {
    const csv = generateCSV([makeTxn({ notes: 'Coffee' })]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('2026-07-01,expense,Food,,Coffee,100');
  });

  it('quotes fields containing commas', () => {
    const csv = generateCSV([makeTxn({ notes: 'Rent, utilities, and more' })]);
    expect(csv).toContain('"Rent, utilities, and more"');
  });

  it('quotes and escapes fields containing double quotes', () => {
    const csv = generateCSV([makeTxn({ notes: 'He said "hi"' })]);
    expect(csv).toContain('"He said ""hi"""');
  });

  it('quotes fields containing newlines', () => {
    const csv = generateCSV([makeTxn({ notes: 'Line1\nLine2' })]);
    expect(csv).toContain('"Line1\nLine2"');
  });

  it('escapes category names with commas', () => {
    const txn = makeTxn({
      categories: {
        id: 'c1', user_id: 'u1', name: 'Food, Dining',
        type: 'expense', color: '#f00', icon: 'utensils',
        created_at: '', updated_at: '',
      },
    });
    const csv = generateCSV([txn]);
    expect(csv).toContain('"Food, Dining"');
  });

  it('escapes account names with commas', () => {
    const txn = makeTxn({
      account: { id: 'a1', name: 'Checking, Savings', color: '#00f' },
    });
    const csv = generateCSV([txn]);
    expect(csv).toContain('"Checking, Savings"');
  });

  it('handles empty category and account gracefully', () => {
    const txn = makeTxn({ categories: null, account: null });
    const csv = generateCSV([txn]);
    const lines = csv.split('\n');
    // Should have empty fields for category and account
    expect(lines[1]).toBe('2026-07-01,expense,,,Test,100');
  });

  it('generates correct headers', () => {
    const csv = generateCSV([makeTxn()]);
    const header = csv.split('\n')[0];
    expect(header).toBe('Date,Type,Category,Account,Description,Amount');
  });

  it('handles empty transaction list', () => {
    const csv = generateCSV([]);
    expect(csv).toBe('Date,Type,Category,Account,Description,Amount');
  });
});

