import { useState, useCallback, useMemo } from 'react';
import { useAnalytics, useCurrency } from '@/hooks/useAnalytics';
import { useCategories } from '@/hooks/useCategories';
import type { AnalyticsFilters, TimeRangePreset, DateRange } from '@/types/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getTransactions } from '@/services/transactions';

import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import TimeRangeFilter from '@/components/analytics/TimeRangeFilter';
import CategoryFilter from '@/components/analytics/CategoryFilter';
import SummaryGrid from '@/components/analytics/SummaryGrid';
import { AnalyticsSkeleton } from '@/components/analytics/AnalyticsSkeleton';
import IncomeVsExpenseChart from '@/components/analytics/IncomeVsExpenseChart';
import ExpenseTrendChart from '@/components/analytics/ExpenseTrendChart';
import CashFlowChart from '@/components/analytics/CashFlowChart';
import DailySpendingChart from '@/components/analytics/DailySpendingChart';
import WeeklySpendingChart from '@/components/analytics/WeeklySpendingChart';
import MonthlySpendingChart from '@/components/analytics/MonthlySpendingChart';
import CategoryPieChart from '@/components/analytics/CategoryPieChart';
import CategoryComparisonChart from '@/components/analytics/CategoryComparisonChart';
import SavingsTrendChart from '@/components/analytics/SavingsTrendChart';
import TopCategories from '@/components/analytics/TopCategories';
import LargestTransactions from '@/components/analytics/LargestTransactions';
import ExpenseHeatmap from '@/components/analytics/ExpenseHeatmap';
import FinancialHealthCard from '@/components/analytics/FinancialHealthCard';
import SmartInsights from '@/components/analytics/SmartInsights';
import SpendingPatterns from '@/components/analytics/SpendingPatterns';
import MonthlyReport from '@/components/analytics/MonthlyReport';
import YearlyReport from '@/components/analytics/YearlyReport';
import CategoryBreakdownTable from '@/components/analytics/CategoryBreakdownTable';
import InvestmentTracker from '@/components/analytics/InvestmentTracker';

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    preset: 'thisMonth',
    type: 'all',
  });

  const currency = useCurrency();
  const analytics = useAnalytics(filters);

  const { user } = useAuth();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  const { data: allTransactions } = useQuery({
    queryKey: queryKeys.analytics.all(user?.id),
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await getTransactions(user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  /** Apply category filter to allTransactions for InvestmentTracker */
  const filteredAllTransactions = useMemo(() => {
    const txns = allTransactions ?? [];
    const ids = filters.categoryIds;
    if (ids === undefined || ids === null) return txns;
    if (ids.length === 0) return [];
    const idSet = new Set(ids);
    return txns.filter((t) => t.category_id !== null && idSet.has(t.category_id));
  }, [allTransactions, filters.categoryIds]);

  const handlePresetChange = useCallback(
    (preset: TimeRangePreset, customRange?: DateRange) => {
      setFilters((prev) => ({ ...prev, preset, customRange }));
    },
    [],
  );

  const handleCategoryChange = useCallback(
    (categoryIds: string[] | null) => {
      setFilters((prev) => ({ ...prev, categoryIds }));
    },
    [],
  );

  const hasActiveCategoryFilter =
    filters.categoryIds !== undefined && filters.categoryIds !== null;

  if (analytics.isError) {
    return (
      <ErrorState
        title="Failed to load analytics"
        description="We couldn't compute your financial data. Please try again."
        retry={() => { analytics.refetch(); }}
      />
    );
  }

  if (analytics.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Deep insights into your financial behavior" />
        <AnalyticsSkeleton />
      </div>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Analytics"
        description="Deep insights into your financial behavior"
      />

      {/* Filters */}
      <div className="space-y-3">
        <TimeRangeFilter
          value={filters.preset}
          customRange={filters.customRange}
          onChange={handlePresetChange}
        />
        <div className="flex flex-wrap items-start gap-3">
          <CategoryFilter
            categories={categoriesData ?? []}
            selectedIds={filters.categoryIds ?? null}
            onChange={handleCategoryChange}
            loading={categoriesLoading}
          />
          {hasActiveCategoryFilter && (
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Reset category filter
            </button>
          )}
        </div>
      </div>

      {/* Empty state when no categories selected */}
      {filters.categoryIds !== undefined &&
        filters.categoryIds !== null &&
        filters.categoryIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">No categories selected</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Select one or more categories from the filter above to see analytics for those categories.
          </p>
          <button
            type="button"
            onClick={() => handleCategoryChange(null)}
            className="mt-3 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
          >
            Show all categories
          </button>
        </div>
      ) : (
      <>
      {/* Summary Cards */}
      {analytics.summary && (
        <SummaryGrid summary={analytics.summary} currency={currency} />
      )}

      {/* Section: Trends */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <IncomeVsExpenseChart data={analytics.monthlySeries} currency={currency} />
          </div>
          <FinancialHealthCard data={analytics.financialHealth} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <CashFlowChart data={analytics.monthlySeries} currency={currency} />
          <SavingsTrendChart data={analytics.savingsTrend} currency={currency} />
        </div>
      </section>

      {/* Section: Investments */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Investments</h2>
        <InvestmentTracker transactions={filteredAllTransactions} currency={currency} />
      </section>

      {/* Section: Category Analysis */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Category Analysis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CategoryPieChart data={analytics.expenseCategories} type="expense" currency={currency} />
          <CategoryPieChart data={analytics.incomeCategories} type="income" currency={currency} />
          <CategoryComparisonChart data={analytics.expenseCategories} currency={currency} />
        </div>
      </section>

      {/* Section: Spending Over Time */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Spending Over Time</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailySpendingChart data={analytics.dailySeries} currency={currency} />
          <ExpenseTrendChart data={analytics.dailySeries} currency={currency} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <WeeklySpendingChart data={analytics.weeklySeries} currency={currency} />
          <MonthlySpendingChart data={analytics.monthlySeries} currency={currency} />
        </div>
      </section>

      {/* Section: Activity Heatmap */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Activity</h2>
        <ExpenseHeatmap data={analytics.heatmapData} currency={currency} />
      </section>

      {/* Section: Rankings & Top Categories */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Rankings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopCategories data={analytics.expenseCategories} currency={currency} />
          <LargestTransactions
            largest={analytics.largestTransactions}
            smallest={analytics.smallestTransactions}
            currency={currency}
          />
        </div>
      </section>

      {/* Section: Insights & Patterns */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Insights & Patterns</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SmartInsights data={analytics.insights} />
          <SpendingPatterns data={analytics.spendingPatterns} currency={currency} />
        </div>
      </section>

      {/* Section: Reports */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Reports</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MonthlyReport data={analytics.monthlyReport} currency={currency} />
          <YearlyReport data={analytics.yearlyReport} currency={currency} />
        </div>
      </section>

      {/* Section: Detailed Breakdown */}
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Detailed Breakdown</h2>
        <CategoryBreakdownTable data={analytics.expenseCategories} currency={currency} />
      </section>
      </>
      )}
    </AnimatedPage>
  );
}

