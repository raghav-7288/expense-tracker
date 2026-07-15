import { useState, useCallback } from 'react';
import { useAnalytics, useCurrency } from '@/hooks/useAnalytics';
import type { AnalyticsFilters, TimeRangePreset, DateRange } from '@/types/analytics';

import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import AnimatedPage from '@/components/ui/AnimatedPage';
import TimeRangeFilter from '@/components/analytics/TimeRangeFilter';
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

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    preset: 'thisMonth',
    type: 'all',
  });

  const currency = useCurrency();
  const analytics = useAnalytics(filters);

  const handlePresetChange = useCallback(
    (preset: TimeRangePreset, customRange?: DateRange) => {
      setFilters((prev) => ({ ...prev, preset, customRange }));
    },
    [],
  );

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

      {/* Time Range */}
      <TimeRangeFilter
        value={filters.preset}
        customRange={filters.customRange}
        onChange={handlePresetChange}
      />

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
    </AnimatedPage>
  );
}

