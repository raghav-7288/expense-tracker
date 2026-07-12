import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { getTransactions, getMonthlyStats } from '@/services/transactions';
import type { DashboardStats, MonthlyData, CategoryBreakdown, Transaction } from '@/types';
import { getMonthStart, getMonthEnd, getMonthName } from '@/utils/formatDate';

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.stats(user?.id),
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) throw new Error('Not authenticated');

      const monthStart = getMonthStart();
      const monthEnd = getMonthEnd();

      const [allResult, monthResult] = await Promise.all([
        getTransactions(user.id),
        getTransactions(user.id, { date_from: monthStart, date_to: monthEnd }),
      ]);

      if (allResult.error) throw allResult.error;
      if (monthResult.error) throw monthResult.error;

      const all = allResult.data ?? [];
      const monthly = monthResult.data ?? [];

      const totalIncome = all
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpenses = all
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const monthlyIncome = monthly
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const monthlyExpenses = monthly
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        totalBalance: totalIncome - totalExpenses,
        totalIncome,
        totalExpenses,
        monthlyIncome,
        monthlyExpenses,
      };
    },
    enabled: !!user,
  });
}

export function useRecentTransactions(limit = 5) {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.recent(user?.id, limit),
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await getTransactions(user.id, {
        sort_by: 'date',
        sort_order: 'desc',
      });
      if (error) throw error;
      return (data ?? []).slice(0, limit);
    },
    enabled: !!user,
  });
}

export function useMonthlyData() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return useQuery({
    queryKey: queryKeys.dashboard.monthly(user?.id, year),
    queryFn: async (): Promise<MonthlyData[]> => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await getMonthlyStats(user.id, year);
      if (error) throw error;

      const monthMap = new Map<string, { income: number; expenses: number }>();

      for (let m = 0; m < 12; m++) {
        const key = `${year}-${String(m + 1).padStart(2, '0')}-01`;
        monthMap.set(key, { income: 0, expenses: 0 });
      }

      for (const row of data ?? []) {
        const month = (row.date as string).substring(0, 7) + '-01';
        const entry = monthMap.get(month);
        if (entry) {
          if (row.type === 'income') {
            entry.income += Number(row.amount);
          } else {
            entry.expenses += Number(row.amount);
          }
        }
      }

      return Array.from(monthMap.entries()).map(([key, value]) => ({
        month: getMonthName(key),
        income: value.income,
        expenses: value.expenses,
      }));
    },
    enabled: !!user,
  });
}

export function useCategoryBreakdown() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.categories(user?.id),
    queryFn: async (): Promise<CategoryBreakdown[]> => {
      if (!user) throw new Error('Not authenticated');

      const monthStart = getMonthStart();
      const monthEnd = getMonthEnd();

      const { data, error } = await getTransactions(user.id, {
        type: 'expense',
        date_from: monthStart,
        date_to: monthEnd,
      });
      if (error) throw error;

      const categoryMap = new Map<string, { amount: number; color: string }>();

      for (const t of data ?? []) {
        const name = t.categories?.name ?? 'Uncategorized';
        const color = t.categories?.color ?? '#6b7280';
        const existing = categoryMap.get(name);
        if (existing) {
          existing.amount += Number(t.amount);
        } else {
          categoryMap.set(name, { amount: Number(t.amount), color });
        }
      }

      const total = Array.from(categoryMap.values()).reduce((s, c) => s + c.amount, 0);

      return Array.from(categoryMap.entries())
        .map(([name, { amount, color }]) => ({
          name,
          amount,
          color,
          percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    },
    enabled: !!user,
  });
}

