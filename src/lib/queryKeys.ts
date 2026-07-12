export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    list: (userId: string | undefined, filters?: unknown) =>
      ['transactions', userId, filters] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (userId: string | undefined, type?: string) =>
      ['categories', userId, type] as const,
  },
  profile: {
    detail: (userId: string | undefined) => ['profile', userId] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: (userId: string | undefined) => ['dashboard', 'stats', userId] as const,
    recent: (userId: string | undefined, limit: number) =>
      ['dashboard', 'recent', userId, limit] as const,
    monthly: (userId: string | undefined, year: number) =>
      ['dashboard', 'monthly', userId, year] as const,
    categories: (userId: string | undefined) =>
      ['dashboard', 'categories', userId] as const,
  },
} as const;

