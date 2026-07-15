import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryGrid from '@/components/analytics/SummaryGrid';
import type { AnalyticsSummary } from '@/types/analytics';

const mockSummary: AnalyticsSummary = {
  currentBalance: 5000,
  totalIncome: 10000,
  totalExpenses: 5000,
  savings: 5000,
  savingsRate: 50,
  transactionCount: 25,
  avgDailySpending: 166.67,
  avgMonthlySpending: 5000,
  highestExpense: 2000,
  highestIncome: 5000,
  incomeChange: 15,
  expenseChange: -10,
  savingsChange: 20,
  transactionCountChange: 5,
};

describe('SummaryGrid', () => {
  it('renders all 10 summary cards', () => {
    render(<SummaryGrid summary={mockSummary} currency="USD" />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Avg Daily')).toBeInTheDocument();
    expect(screen.getByText('Avg Monthly')).toBeInTheDocument();
    expect(screen.getByText('Largest Expense')).toBeInTheDocument();
    expect(screen.getByText('Largest Income')).toBeInTheDocument();
  });

  it('displays savings rate as percentage', () => {
    render(<SummaryGrid summary={mockSummary} currency="USD" />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows transaction count', () => {
    render(<SummaryGrid summary={mockSummary} currency="USD" />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows change percentages for cards with changes', () => {
    render(<SummaryGrid summary={mockSummary} currency="USD" />);
    // Income has +15% change
    expect(screen.getByText('15%')).toBeInTheDocument();
  });

  it('shows zero change indicator', () => {
    const zeroChangeSummary = { ...mockSummary, incomeChange: 0, expenseChange: 0, savingsChange: 0, transactionCountChange: 0 };
    render(<SummaryGrid summary={zeroChangeSummary} currency="USD" />);
    const zeroIndicators = screen.getAllByText('0%');
    expect(zeroIndicators.length).toBeGreaterThan(0);
  });

  it('renders negative savings with danger variant', () => {
    const negativeSavings = { ...mockSummary, savings: -500 };
    const { container } = render(<SummaryGrid summary={negativeSavings} currency="USD" />);
    // Should contain red-colored elements for negative savings
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
  });
});

