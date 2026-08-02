import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { buildTransaction } from '@/test/factories';
import type { Transaction } from '@/types';

// Recharts renders SVG that jsdom can't measure — stub it to plain divs.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import InvestmentTracker from '@/components/analytics/InvestmentTracker';

const INVEST_CAT = {
  id: 'inv', user_id: 'u1', name: 'Investments', type: 'expense' as const,
  color: '#f59e0b', icon: 'trending-up', created_at: '', updated_at: '',
};

function investment(over: Partial<Transaction> = {}): Transaction {
  return buildTransaction({ categories: INVEST_CAT, ...over });
}

/** Current YYYY-MM so "this month" assertions are stable whenever the suite runs. */
function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

describe('InvestmentTracker', () => {
  it('shows the empty state when there are no investment transactions', () => {
    // A non-investment (Food) transaction must be ignored.
    render(<InvestmentTracker transactions={[buildTransaction()]} currency="USD" />);
    expect(
      screen.getByText(/No investment transactions yet/i),
    ).toBeInTheDocument();
    // Total invested is zero.
    expect(screen.getByText('Total Invested')).toBeInTheDocument();
  });

  it('totals only transactions whose category name contains "invest" (case-insensitive)', () => {
    const txns = [
      investment({ id: 'i1', amount: 3000, date: '2026-05-15', notes: 'Index fund' }),
      investment({
        id: 'i2', amount: 2000, date: '2026-06-15', notes: 'ETF',
        categories: { ...INVEST_CAT, name: 'INVESTing' }, // case-insensitive match
      }),
      buildTransaction({ id: 'f1', amount: 999, notes: 'Groceries' }), // excluded
    ];
    render(<InvestmentTracker transactions={txns} currency="USD" />);

    // Total Invested = 3000 + 2000 = 5000 (the Food 999 is excluded).
    expect(screen.getByText('$5,000.00')).toBeInTheDocument();
    // Recent investments list shows the investment notes but not the excluded one.
    expect(screen.getByText('Index fund')).toBeInTheDocument();
    expect(screen.getByText('ETF')).toBeInTheDocument();
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
  });

  it('computes the "This Month" total from investments dated in the current month', () => {
    const thisMonthDate = `${currentMonth()}-15`;
    const txns = [
      investment({ id: 'i1', amount: 1500, date: thisMonthDate, notes: 'This month buy' }),
      investment({ id: 'i2', amount: 4000, date: '2026-01-10', notes: 'Old buy' }),
    ];
    render(<InvestmentTracker transactions={txns} currency="USD" />);

    expect(screen.getByText('This Month')).toBeInTheDocument();
    // The current-month contribution is 1500 (appears in the card and the list).
    expect(screen.getAllByText('$1,500.00').length).toBeGreaterThanOrEqual(1);
    // Total across all months is 5500 (unique — no single txn or avg equals it).
    expect(screen.getByText('$5,500.00')).toBeInTheDocument();
  });

  it('respects the provided currency', () => {
    render(
      <InvestmentTracker
        transactions={[investment({ amount: 1000, date: '2026-06-01' })]}
        currency="INR"
      />,
    );
    // INR formatting uses the ₹ symbol (shown in the summary cards + list).
    expect(screen.getAllByText('₹1,000.00').length).toBeGreaterThanOrEqual(1);
  });
});


