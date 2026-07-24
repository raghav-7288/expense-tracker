import type { Transaction } from '@/types';
import type {
  TimeRangePreset,
  DateRange,
  AnalyticsFilters,
  AnalyticsSummary,
  TimeSeriesPoint,
  CategoryBreakdownItem,
  HeatmapDay,
  FinancialHealthScore,
  InsightItem,
  SpendingPatternData,
  MonthlyReportData,
  YearlyReportData,
  TransactionRankingItem,
} from '@/types/analytics';
import { formatCurrency } from '@/utils/formatCurrency';

/* ============================================================
   DATE UTILITIES
   ============================================================ */

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

function diffDays(start: string, end: string): number {
  const s = parseDate(start).getTime();
  const e = parseDate(end).getTime();
  return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}

function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

export function getDateRange(
  preset: TimeRangePreset,
  customRange?: DateRange,
): DateRange {
  const now = new Date();
  const today = toLocalISODate(now);

  switch (preset) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const ys = toLocalISODate(y);
      return { startDate: ys, endDate: ys };
    }
    case 'last7': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { startDate: toLocalISODate(s), endDate: today };
    }
    case 'last30': {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return { startDate: toLocalISODate(s), endDate: today };
    }
    case 'thisMonth': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toLocalISODate(s), endDate: toLocalISODate(e) };
    }
    case 'lastMonth': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toLocalISODate(s), endDate: toLocalISODate(e) };
    }
    case 'last3Months': {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { startDate: toLocalISODate(s), endDate: today };
    }
    case 'last6Months': {
      const s = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { startDate: toLocalISODate(s), endDate: today };
    }
    case 'thisYear': {
      const s = new Date(now.getFullYear(), 0, 1);
      const e = new Date(now.getFullYear(), 11, 31);
      return { startDate: toLocalISODate(s), endDate: toLocalISODate(e) };
    }
    case 'custom':
      return customRange ?? { startDate: today, endDate: today };
  }
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const days = diffDays(range.startDate, range.endDate);
  const prevEnd = addDays(range.startDate, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { startDate: prevStart, endDate: prevEnd };
}

/* ============================================================
   FILTERING
   ============================================================ */

export function filterTransactions(
  transactions: Transaction[],
  range: DateRange,
  filters?: Pick<AnalyticsFilters, 'categoryId' | 'categoryIds' | 'type'>,
): Transaction[] {
  const categoryIdSet = filters?.categoryIds ? new Set(filters.categoryIds) : null;

  return transactions.filter((t) => {
    if (t.date < range.startDate || t.date > range.endDate) return false;
    if (filters?.type && filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters?.categoryId && t.category_id !== filters.categoryId) return false;
    if (categoryIdSet && (t.category_id === null || !categoryIdSet.has(t.category_id))) return false;
    return true;
  });
}

/* ============================================================
   SUMMARY STATISTICS
   ============================================================ */

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function computeSummary(
  current: Transaction[],
  previous: Transaction[],
  allTransactions: Transaction[],
  range: DateRange,
): AnalyticsSummary {
  const days = diffDays(range.startDate, range.endDate);
  const months = Math.max(1, days / 30);

  const totalIncome = current
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = current
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

  const prevIncome = previous
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const prevExpenses = previous
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);
  const prevSavings = prevIncome - prevExpenses;

  const allIncome = allTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const allExpenses = allTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const expenseAmounts = current
    .filter((t) => t.type === 'expense')
    .map((t) => Number(t.amount));
  const incomeAmounts = current
    .filter((t) => t.type === 'income')
    .map((t) => Number(t.amount));

  return {
    currentBalance: allIncome - allExpenses,
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    transactionCount: current.length,
    avgDailySpending: days > 0 ? totalExpenses / days : 0,
    avgMonthlySpending: totalExpenses / months,
    highestExpense: expenseAmounts.length > 0 ? Math.max(...expenseAmounts) : 0,
    highestIncome: incomeAmounts.length > 0 ? Math.max(...incomeAmounts) : 0,
    incomeChange: pctChange(totalIncome, prevIncome),
    expenseChange: pctChange(totalExpenses, prevExpenses),
    savingsChange: pctChange(savings, prevSavings),
    transactionCountChange: pctChange(current.length, previous.length),
  };
}

/* ============================================================
   TIME SERIES
   ============================================================ */

export function computeDailySeries(
  transactions: Transaction[],
  range: DateRange,
): TimeSeriesPoint[] {
  const map = new Map<string, { income: number; expenses: number }>();
  const days = diffDays(range.startDate, range.endDate);

  for (let i = 0; i < days; i++) {
    const date = addDays(range.startDate, i);
    map.set(date, { income: 0, expenses: 0 });
  }

  for (const t of transactions) {
    const entry = map.get(t.date);
    if (entry) {
      if (t.type === 'income') entry.income += Number(t.amount);
      else entry.expenses += Number(t.amount);
    }
  }

  return Array.from(map.entries()).map(([date, val]) => {
    const d = parseDate(date);
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
    return { date, label, income: val.income, expenses: val.expenses, net: val.income - val.expenses };
  });
}

export function computeWeeklySeries(
  transactions: Transaction[],
  range: DateRange,
): TimeSeriesPoint[] {
  const weekMap = new Map<string, { income: number; expenses: number; endDate: string }>();
  const days = diffDays(range.startDate, range.endDate);

  let weekStart = range.startDate;
  while (weekStart <= range.endDate) {
    const remaining = diffDays(weekStart, range.endDate);
    const weekDays = Math.min(7, remaining);
    const weekEnd = addDays(weekStart, weekDays - 1);
    weekMap.set(weekStart, { income: 0, expenses: 0, endDate: weekEnd });
    weekStart = addDays(weekStart, weekDays);
  }

  for (const t of transactions) {
    for (const [start, val] of weekMap) {
      if (t.date >= start && t.date <= val.endDate) {
        if (t.type === 'income') val.income += Number(t.amount);
        else val.expenses += Number(t.amount);
        break;
      }
    }
  }

  return Array.from(weekMap.entries()).map(([start, val]) => {
    const s = parseDate(start);
    const e = parseDate(val.endDate);
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const label = days <= 14 ? fmt.format(s) : `${fmt.format(s)} – ${fmt.format(e)}`;
    return { date: start, label, income: val.income, expenses: val.expenses, net: val.income - val.expenses };
  });
}

export function computeMonthlySeries(
  transactions: Transaction[],
  range: DateRange,
): TimeSeriesPoint[] {
  const map = new Map<string, { income: number; expenses: number }>();
  const start = parseDate(range.startDate);
  const end = parseDate(range.endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    const key = toLocalISODate(current);
    map.set(key, { income: 0, expenses: 0 });
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  for (const t of transactions) {
    const d = parseDate(t.date);
    const key = toLocalISODate(new Date(d.getFullYear(), d.getMonth(), 1));
    const entry = map.get(key);
    if (entry) {
      if (t.type === 'income') entry.income += Number(t.amount);
      else entry.expenses += Number(t.amount);
    }
  }

  return Array.from(map.entries()).map(([date, val]) => {
    const d = parseDate(date);
    const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(d);
    return { date, label, income: val.income, expenses: val.expenses, net: val.income - val.expenses };
  });
}

export function computeSavingsTrend(
  transactions: Transaction[],
  range: DateRange,
): TimeSeriesPoint[] {
  const monthly = computeMonthlySeries(transactions, range);
  let cumulative = 0;
  return monthly.map((m) => {
    cumulative += m.net;
    return { ...m, net: cumulative };
  });
}

/* ============================================================
   CATEGORY ANALYSIS
   ============================================================ */

export function computeCategoryBreakdown(
  transactions: Transaction[],
  type: 'income' | 'expense',
): CategoryBreakdownItem[] {
  const filtered = transactions.filter((t) => t.type === type);
  const map = new Map<string, { color: string; icon: string; amounts: number[] }>();

  for (const t of filtered) {
    const name = t.categories?.name ?? 'Uncategorized';
    const color = t.categories?.color ?? '#6b7280';
    const icon = t.categories?.icon ?? 'tag';
    const entry = map.get(name);
    if (entry) {
      entry.amounts.push(Number(t.amount));
    } else {
      map.set(name, { color, icon, amounts: [Number(t.amount)] });
    }
  }

  const total = filtered.reduce((s, t) => s + Number(t.amount), 0);

  return Array.from(map.entries())
    .map(([name, { color, icon, amounts }]) => {
      const amount = amounts.reduce((a, b) => a + b, 0);
      return {
        name,
        color,
        icon,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        count: amounts.length,
        avgTransaction: amounts.length > 0 ? amount / amounts.length : 0,
        highestTransaction: Math.max(...amounts),
        lowestTransaction: Math.min(...amounts),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

/* ============================================================
   HEATMAP
   ============================================================ */

export function computeHeatmap(transactions: Transaction[]): HeatmapDay[] {
  const now = new Date();
  const endDate = toLocalISODate(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 364);
  const startDate = toLocalISODate(start);

  const dayMap = new Map<string, { amount: number; count: number }>();
  for (let i = 0; i < 365; i++) {
    const d = addDays(startDate, i);
    dayMap.set(d, { amount: 0, count: 0 });
  }

  const expenses = transactions.filter(
    (t) => t.type === 'expense' && t.date >= startDate && t.date <= endDate,
  );
  for (const t of expenses) {
    const entry = dayMap.get(t.date);
    if (entry) {
      entry.amount += Number(t.amount);
      entry.count++;
    }
  }

  const amounts = Array.from(dayMap.values())
    .map((v) => v.amount)
    .filter((a) => a > 0);
  const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 1;

  return Array.from(dayMap.entries()).map(([date, val]) => {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (val.amount > 0) {
      const ratio = val.amount / maxAmount;
      if (ratio <= 0.25) level = 1;
      else if (ratio <= 0.5) level = 2;
      else if (ratio <= 0.75) level = 3;
      else level = 4;
    }
    return { date, amount: val.amount, count: val.count, level };
  });
}

/* ============================================================
   FINANCIAL HEALTH
   ============================================================ */

export function computeFinancialHealth(
  summary: AnalyticsSummary,
): FinancialHealthScore {
  const factors: FinancialHealthScore['factors'] = [];

  // Savings rate (max 30 points)
  const savingsScore = Math.min(30, Math.max(0, Math.round(summary.savingsRate * 0.6)));
  factors.push({
    name: 'Savings Rate',
    score: savingsScore,
    maxScore: 30,
    description:
      summary.savingsRate >= 20
        ? 'Excellent savings rate'
        : summary.savingsRate >= 10
          ? 'Good savings rate'
          : 'Consider increasing savings',
  });

  // Income stability (max 25 points)
  const incomeScore = summary.totalIncome > 0 ? 25 : 0;
  factors.push({
    name: 'Income',
    score: incomeScore,
    maxScore: 25,
    description: summary.totalIncome > 0 ? 'Income recorded' : 'No income recorded',
  });

  // Expense control (max 25 points)
  const expenseRatio = summary.totalIncome > 0 ? summary.totalExpenses / summary.totalIncome : 1;
  const expenseScore = Math.min(25, Math.max(0, Math.round((1 - expenseRatio) * 50)));
  factors.push({
    name: 'Expense Control',
    score: expenseScore,
    maxScore: 25,
    description:
      expenseRatio <= 0.5
        ? 'Expenses well controlled'
        : expenseRatio <= 0.8
          ? 'Reasonable spending'
          : 'Expenses may be too high',
  });

  // Spending consistency (max 20 points)
  const trendScore = Math.abs(summary.expenseChange) <= 15 ? 20 : Math.abs(summary.expenseChange) <= 30 ? 10 : 5;
  factors.push({
    name: 'Consistency',
    score: trendScore,
    maxScore: 20,
    description:
      Math.abs(summary.expenseChange) <= 15
        ? 'Stable spending patterns'
        : 'Spending patterns vary significantly',
  });

  const score = factors.reduce((s, f) => s + f.score, 0);

  let grade: string;
  let label: string;
  let color: string;
  if (score >= 85) {
    grade = 'A';
    label = 'Excellent';
    color = '#10b981';
  } else if (score >= 70) {
    grade = 'B';
    label = 'Good';
    color = '#3b82f6';
  } else if (score >= 55) {
    grade = 'C';
    label = 'Fair';
    color = '#f59e0b';
  } else if (score >= 40) {
    grade = 'D';
    label = 'Needs Work';
    color = '#f97316';
  } else {
    grade = 'F';
    label = 'Poor';
    color = '#ef4444';
  }

  return { score, grade, label, color, factors };
}

/* ============================================================
   SMART INSIGHTS
   ============================================================ */

export function generateInsights(
  transactions: Transaction[],
  summary: AnalyticsSummary,
  expenseCategories: CategoryBreakdownItem[],
  currency: string,
): InsightItem[] {
  const insights: InsightItem[] = [];

  if (expenseCategories.length > 0) {
    const top = expenseCategories[0];
    if (top) {
      insights.push({
        id: String(insights.length + 1),
        type: 'info',
        message: `You spend most on ${top.name}`,
        detail: `${top.percentage}% of your expenses go to ${top.name}`,
      });
    }
  }

  if (summary.savingsRate >= 20) {
    insights.push({
      id: String(insights.length + 1),
      type: 'success',
      message: `Great savings rate of ${summary.savingsRate}%!`,
      detail: 'You are saving more than the recommended 20%',
    });
  } else if (summary.savingsRate > 0 && summary.savingsRate < 10) {
    insights.push({
      id: String(insights.length + 1),
      type: 'warning',
      message: `Your savings rate is only ${summary.savingsRate}%`,
      detail: 'Financial experts recommend saving at least 20% of income',
    });
  }

  if (summary.expenseChange > 20) {
    insights.push({
      id: String(insights.length + 1),
      type: 'warning',
      message: `Spending increased by ${summary.expenseChange}%`,
      detail: 'Your expenses are significantly higher than the previous period',
    });
  } else if (summary.expenseChange < -10) {
    insights.push({
      id: String(insights.length + 1),
      type: 'success',
      message: `Spending decreased by ${Math.abs(summary.expenseChange)}%`,
      detail: 'Great job reducing your expenses!',
    });
  }

  if (summary.savingsChange > 0 && summary.savings > 0) {
    insights.push({
      id: String(insights.length + 1),
      type: 'success',
      message: `You saved ${summary.savingsChange}% more than last period`,
    });
  }

  // Weekend vs weekday analysis
  const expenses = transactions.filter((t) => t.type === 'expense');
  const weekendExpenses = expenses.filter((t) => {
    const day = parseDate(t.date).getDay();
    return day === 0 || day === 6;
  });
  const weekdayExpenses = expenses.filter((t) => {
    const day = parseDate(t.date).getDay();
    return day !== 0 && day !== 6;
  });

  const weekendTotal = weekendExpenses.reduce((s, t) => s + Number(t.amount), 0);
  const weekdayTotal = weekdayExpenses.reduce((s, t) => s + Number(t.amount), 0);
  const weekendAvg = weekendExpenses.length > 0 ? weekendTotal / weekendExpenses.length : 0;
  const weekdayAvg = weekdayExpenses.length > 0 ? weekdayTotal / weekdayExpenses.length : 0;

  if (weekendAvg > weekdayAvg * 1.3 && weekendExpenses.length > 0 && weekdayAvg > 0) {
    insights.push({
      id: String(insights.length + 1),
      type: 'info',
      message: 'Weekend spending is higher than weekdays',
      detail: `Average weekend transaction is ${Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100)}% more`,
    });
  }

  // Busiest spending day
  const dayTotals = new Map<number, number>();
  for (const t of expenses) {
    const day = parseDate(t.date).getDay();
    dayTotals.set(day, (dayTotals.get(day) ?? 0) + Number(t.amount));
  }
  if (dayTotals.size > 0) {
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    let maxDay = 0;
    let maxAmount = 0;
    for (const [day, amount] of dayTotals) {
      if (amount > maxAmount) {
        maxDay = day;
        maxAmount = amount;
      }
    }
    insights.push({
      id: String(insights.length + 1),
      type: 'info',
      message: `Most spending happens on ${dayNames[maxDay] ?? 'N/A'}`,
    });
  }

  // Category with biggest increase (if we have multiple categories)
  for (const cat of expenseCategories.slice(0, 3)) {
    if (cat.percentage >= 35) {
      insights.push({
        id: String(insights.length + 1),
        type: 'tip',
        message: `${cat.name} represents ${cat.percentage}% of expenses`,
        detail: `Consider if you can reduce spending in this category`,
      });
      break;
    }
  }

  if (summary.highestExpense > 0) {
    insights.push({
      id: String(insights.length + 1),
      type: 'info',
      message: `Your largest expense was ${formatCurrency(summary.highestExpense, currency)}`,
    });
  }

  if (summary.avgDailySpending > 0) {
    insights.push({
      id: String(insights.length + 1),
      type: 'info',
      message: `Your average daily spending is ${formatCurrency(summary.avgDailySpending, currency)}`,
    });
  }

  return insights;
}

/* ============================================================
   SPENDING PATTERNS
   ============================================================ */

export function computeSpendingPatterns(transactions: Transaction[]): SpendingPatternData {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const expenses = transactions.filter((t) => t.type === 'expense');

  const byDay = new Map<number, { total: number; count: number }>();
  for (let i = 0; i < 7; i++) byDay.set(i, { total: 0, count: 0 });

  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  for (const t of expenses) {
    const day = parseDate(t.date).getDay();
    const amount = Number(t.amount);
    const entry = byDay.get(day);
    if (entry) {
      entry.total += amount;
      entry.count++;
    }
    if (day === 0 || day === 6) {
      weekendTotal += amount;
      weekendCount++;
    } else {
      weekdayTotal += amount;
      weekdayCount++;
    }
  }

  const byDayOfWeek = Array.from(byDay.entries())
    .sort(([a], [b]) => ((a + 6) % 7) - ((b + 6) % 7))
    .map(([dayIdx, val]) => ({
      day: dayNames[dayIdx] ?? '',
      shortDay: shortDays[dayIdx] ?? '',
      amount: val.total,
      count: val.count,
    }));

  const sorted = [...byDayOfWeek].sort((a, b) => b.amount - a.amount);
  const busiestDay = sorted[0]?.day ?? 'N/A';
  const quietestDay = sorted[sorted.length - 1]?.day ?? 'N/A';

  return {
    weekdayTotal,
    weekendTotal,
    weekdayAvg: weekdayCount > 0 ? weekdayTotal / weekdayCount : 0,
    weekendAvg: weekendCount > 0 ? weekendTotal / weekendCount : 0,
    byDayOfWeek,
    busiestDay,
    quietestDay,
  };
}

/* ============================================================
   MONTHLY REPORT
   ============================================================ */

export function computeMonthlyReport(
  current: Transaction[],
  previous: Transaction[],
  monthLabel: string,
): MonthlyReportData {
  const income = current.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = current.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const prevIncome = previous.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const prevExpenses = previous.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const prevSavings = prevIncome - prevExpenses;

  // Biggest category
  const catMap = new Map<string, number>();
  for (const t of current.filter((t) => t.type === 'expense')) {
    const name = t.categories?.name ?? 'Uncategorized';
    catMap.set(name, (catMap.get(name) ?? 0) + Number(t.amount));
  }
  let biggestCategory = 'N/A';
  let biggestAmount = 0;
  for (const [name, amount] of catMap) {
    if (amount > biggestAmount) {
      biggestCategory = name;
      biggestAmount = amount;
    }
  }

  // Most expensive day
  const dayMap = new Map<string, number>();
  for (const t of current.filter((t) => t.type === 'expense')) {
    dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + Number(t.amount));
  }
  let mostExpensiveDay = 'N/A';
  let maxDayAmount = 0;
  for (const [date, amount] of dayMap) {
    if (amount > maxDayAmount) {
      mostExpensiveDay = date;
      maxDayAmount = amount;
    }
  }
  if (mostExpensiveDay !== 'N/A') {
    mostExpensiveDay = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(parseDate(mostExpensiveDay));
  }

  const expChange = pctChange(expenses, prevExpenses);
  let comparisonText: string;
  if (expChange > 0) {
    comparisonText = `You spent ${expChange}% more than the previous period.`;
  } else if (expChange < 0) {
    comparisonText = `You spent ${Math.abs(expChange)}% less than the previous period.`;
  } else {
    comparisonText = 'Your spending is consistent with the previous period.';
  }

  const savChange = pctChange(savings, prevSavings);
  if (savChange > 0 && savings > 0) {
    comparisonText += ` You saved ${savChange}% more!`;
  }

  return {
    monthLabel,
    totalIncome: income,
    totalExpenses: expenses,
    savings,
    savingsRate,
    biggestCategory,
    mostExpensiveDay,
    avgTransaction: current.length > 0 ? (income + expenses) / current.length : 0,
    transactionCount: current.length,
    incomeChange: pctChange(income, prevIncome),
    expenseChange: expChange,
    savingsChange: savChange,
    comparisonText,
  };
}

/* ============================================================
   YEARLY REPORT
   ============================================================ */

export function computeYearlyReport(
  transactions: Transaction[],
  year: number,
): YearlyReportData {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const yearTxns = transactions.filter((t) => t.date.startsWith(String(year)));
  const months: YearlyReportData['months'] = monthNames.map((month, idx) => {
    const monthStr = String(idx + 1).padStart(2, '0');
    const prefix = `${year}-${monthStr}`;
    const monthTxns = yearTxns.filter((t) => t.date.startsWith(prefix));
    const income = monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { month, shortMonth: shortMonths[idx] ?? '', income, expenses, savings: income - expenses };
  });

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);
  const activeMonths = months.filter((m) => m.income > 0 || m.expenses > 0);

  const highestSpendingMonth = [...months].sort((a, b) => b.expenses - a.expenses)[0]?.month ?? 'N/A';
  const highestIncomeMonth = [...months].sort((a, b) => b.income - a.income)[0]?.month ?? 'N/A';
  const bestSavingsMonth = [...months].sort((a, b) => b.savings - a.savings)[0]?.month ?? 'N/A';

  return {
    year,
    months,
    totalIncome,
    totalExpenses,
    totalSavings: totalIncome - totalExpenses,
    highestSpendingMonth,
    highestIncomeMonth,
    bestSavingsMonth,
    avgMonthlySpending: activeMonths.length > 0 ? totalExpenses / activeMonths.length : 0,
    avgMonthlyIncome: activeMonths.length > 0 ? totalIncome / activeMonths.length : 0,
  };
}

/* ============================================================
   TRANSACTION RANKINGS
   ============================================================ */

export function getTransactionRankings(
  transactions: Transaction[],
  type: 'largest' | 'smallest',
  limit = 10,
): TransactionRankingItem[] {
  const sorted = [...transactions].sort((a, b) =>
    type === 'largest'
      ? Number(b.amount) - Number(a.amount)
      : Number(a.amount) - Number(b.amount),
  );

  return sorted.slice(0, limit).map((t) => ({
    id: t.id,
    notes: t.notes,
    amount: Number(t.amount),
    date: t.date,
    categoryName: t.categories?.name ?? 'Uncategorized',
    categoryColor: t.categories?.color ?? '#6b7280',
    type: t.type,
  }));
}

/* ============================================================
   CSV EXPORT
   ============================================================ */

export function generateCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.categories?.name ?? '',
    `"${t.notes.replace(/"/g, '""')}"`,
    String(t.amount),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


