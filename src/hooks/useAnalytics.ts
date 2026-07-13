import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { queryKeys } from '@/lib/queryKeys';
import { getTransactions } from '@/services/transactions';
import type { Transaction } from '@/types';
import type { AnalyticsFilters, AnalyticsData, DateRange } from '@/types/analytics';
import {
  getDateRange,
  getPreviousPeriod,
  filterTransactions,
  computeSummary,
  computeDailySeries,
  computeWeeklySeries,
  computeMonthlySeries,
  computeSavingsTrend,
  computeCategoryBreakdown,
  computeHeatmap,
  computeFinancialHealth,
  generateInsights,
  computeSpendingPatterns,
  computeMonthlyReport,
  computeYearlyReport,
  getTransactionRankings,
} from '@/engines/analytics';

export function useAnalytics(filters: AnalyticsFilters): AnalyticsData {
  const { user } = useAuth();

  const {
    data: allTransactions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.analytics.all(user?.id),
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await getTransactions(user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const dateRange: DateRange = useMemo(
    () => getDateRange(filters.preset, filters.customRange),
    [filters.preset, filters.customRange],
  );

  const prevDateRange = useMemo(() => getPreviousPeriod(dateRange), [dateRange]);

  const currentTransactions = useMemo(
    () => filterTransactions(allTransactions ?? [], dateRange, filters),
    [allTransactions, dateRange, filters],
  );

  const prevTransactions = useMemo(
    () => filterTransactions(allTransactions ?? [], prevDateRange),
    [allTransactions, prevDateRange],
  );

  const summary = useMemo(() => {
    if (!allTransactions) return null;
    return computeSummary(currentTransactions, prevTransactions, allTransactions, dateRange);
  }, [currentTransactions, prevTransactions, allTransactions, dateRange]);

  const dailySeries = useMemo(
    () => computeDailySeries(currentTransactions, dateRange),
    [currentTransactions, dateRange],
  );

  const weeklySeries = useMemo(
    () => computeWeeklySeries(currentTransactions, dateRange),
    [currentTransactions, dateRange],
  );

  const monthlySeries = useMemo(
    () => computeMonthlySeries(currentTransactions, dateRange),
    [currentTransactions, dateRange],
  );

  const savingsTrend = useMemo(
    () => computeSavingsTrend(allTransactions ?? [], dateRange),
    [allTransactions, dateRange],
  );

  const expenseCategories = useMemo(
    () => computeCategoryBreakdown(currentTransactions, 'expense'),
    [currentTransactions],
  );

  const incomeCategories = useMemo(
    () => computeCategoryBreakdown(currentTransactions, 'income'),
    [currentTransactions],
  );

  const heatmapData = useMemo(
    () => computeHeatmap(allTransactions ?? []),
    [allTransactions],
  );

  const financialHealth = useMemo(
    () => (summary ? computeFinancialHealth(summary) : null),
    [summary],
  );

  const insights = useMemo(
    () => (summary ? generateInsights(currentTransactions, summary, expenseCategories) : []),
    [currentTransactions, summary, expenseCategories],
  );

  const spendingPatterns = useMemo(
    () => (currentTransactions.length > 0 ? computeSpendingPatterns(currentTransactions) : null),
    [currentTransactions],
  );

  const monthlyReport = useMemo(() => {
    if (currentTransactions.length === 0 && prevTransactions.length === 0) return null;
    const label = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(dateRange.startDate + 'T00:00:00'),
    );
    return computeMonthlyReport(currentTransactions, prevTransactions, label);
  }, [currentTransactions, prevTransactions, dateRange]);

  const yearlyReport = useMemo(() => {
    const year = new Date().getFullYear();
    return computeYearlyReport(allTransactions ?? [], year);
  }, [allTransactions]);

  const largestTransactions = useMemo(
    () => getTransactionRankings(currentTransactions, 'largest'),
    [currentTransactions],
  );

  const smallestTransactions = useMemo(
    () => getTransactionRankings(currentTransactions, 'smallest'),
    [currentTransactions],
  );

  return {
    isLoading,
    isError,
    refetch,
    dateRange,
    summary,
    dailySeries,
    weeklySeries,
    monthlySeries,
    expenseCategories,
    incomeCategories,
    heatmapData,
    financialHealth,
    insights,
    spendingPatterns,
    monthlyReport,
    yearlyReport,
    largestTransactions,
    smallestTransactions,
    savingsTrend,
  };
}

export { useCurrency };


