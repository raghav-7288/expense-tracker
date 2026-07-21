import type { TransactionType } from '@/types';

export type TimeRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'last6Months'
  | 'thisYear'
  | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface AnalyticsFilters {
  preset: TimeRangePreset;
  customRange?: DateRange;
  categoryId?: string;
  /** Multi-select category filter. `null`/`undefined` = all, `[]` = none. */
  categoryIds?: string[] | null;
  type?: TransactionType | 'all';
}

export interface AnalyticsSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  transactionCount: number;
  avgDailySpending: number;
  avgMonthlySpending: number;
  highestExpense: number;
  highestIncome: number;
  incomeChange: number;
  expenseChange: number;
  savingsChange: number;
  transactionCountChange: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdownItem {
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
  avgTransaction: number;
  highestTransaction: number;
  lowestTransaction: number;
}

export interface HeatmapDay {
  date: string;
  amount: number;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface InsightItem {
  id: string;
  type: 'info' | 'warning' | 'success' | 'tip';
  message: string;
  detail?: string;
}

export interface FinancialHealthScore {
  score: number;
  grade: string;
  label: string;
  color: string;
  factors: HealthFactor[];
}

export interface HealthFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface SpendingPatternData {
  weekdayTotal: number;
  weekendTotal: number;
  weekdayAvg: number;
  weekendAvg: number;
  byDayOfWeek: DayOfWeekSpending[];
  busiestDay: string;
  quietestDay: string;
}

export interface DayOfWeekSpending {
  day: string;
  shortDay: string;
  amount: number;
  count: number;
}

export interface MonthlyReportData {
  monthLabel: string;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  biggestCategory: string;
  mostExpensiveDay: string;
  avgTransaction: number;
  transactionCount: number;
  incomeChange: number;
  expenseChange: number;
  savingsChange: number;
  comparisonText: string;
}

export interface YearlyMonth {
  month: string;
  shortMonth: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface YearlyReportData {
  year: number;
  months: YearlyMonth[];
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  highestSpendingMonth: string;
  highestIncomeMonth: string;
  bestSavingsMonth: string;
  avgMonthlySpending: number;
  avgMonthlyIncome: number;
}

export interface TransactionRankingItem {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryName: string;
  categoryColor: string;
  type: TransactionType;
}

export interface AnalyticsData {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  dateRange: DateRange;
  summary: AnalyticsSummary | null;
  dailySeries: TimeSeriesPoint[];
  weeklySeries: TimeSeriesPoint[];
  monthlySeries: TimeSeriesPoint[];
  expenseCategories: CategoryBreakdownItem[];
  incomeCategories: CategoryBreakdownItem[];
  heatmapData: HeatmapDay[];
  financialHealth: FinancialHealthScore | null;
  insights: InsightItem[];
  spendingPatterns: SpendingPatternData | null;
  monthlyReport: MonthlyReportData | null;
  yearlyReport: YearlyReportData | null;
  largestTransactions: TransactionRankingItem[];
  smallestTransactions: TransactionRankingItem[];
  savingsTrend: TimeSeriesPoint[];
}

