import type { Profile, Category, Transaction } from '@/types';

let idCounter = 0;
function nextId() {
  return `test-id-${++idCounter}`;
}

export function resetFactoryIds() {
  idCounter = 0;
}

export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-123',
    email: '[REDACTED_EMAIL_ADDRESS_2]',
    full_name: 'Test User',
    avatar_url: null,
    currency: 'USD',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function buildCategory(overrides: Partial<Category> = {}): Category {
  const id = nextId();
  return {
    id,
    user_id: 'user-123',
    name: `Category ${id}`,
    type: 'expense',
    color: '#ef4444',
    icon: 'tag',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function buildTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const id = nextId();
  return {
    id,
    user_id: 'user-123',
    category_id: 'cat-1',
    type: 'expense',
    amount: 50.00,
    description: `Transaction ${id}`,
    notes: null,
    date: '2024-06-15',
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    categories: {
      id: 'cat-1',
      user_id: 'user-123',
      name: 'Food',
      type: 'expense',
      color: '#ef4444',
      icon: 'utensils',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    ...overrides,
  };
}

