import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FinancialHealthCard from '@/components/analytics/FinancialHealthCard';
import type { FinancialHealthScore } from '@/types/analytics';

describe('FinancialHealthCard', () => {
  const excellentHealth: FinancialHealthScore = {
    score: 90,
    grade: 'A',
    label: 'Excellent',
    color: '#10b981',
    factors: [
      { name: 'Savings Rate', score: 28, maxScore: 30, description: 'Excellent savings rate' },
      { name: 'Income', score: 25, maxScore: 25, description: 'Income recorded' },
      { name: 'Expense Control', score: 22, maxScore: 25, description: 'Expenses well controlled' },
      { name: 'Consistency', score: 15, maxScore: 20, description: 'Stable spending patterns' },
    ],
  };

  it('renders score and grade', () => {
    render(<FinancialHealthCard data={excellentHealth} />);
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText(/A — Excellent/)).toBeInTheDocument();
  });

  it('renders all factors', () => {
    render(<FinancialHealthCard data={excellentHealth} />);
    expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expense Control')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
  });

  it('renders factor descriptions', () => {
    render(<FinancialHealthCard data={excellentHealth} />);
    expect(screen.getByText('Excellent savings rate')).toBeInTheDocument();
    expect(screen.getByText('Expenses well controlled')).toBeInTheDocument();
  });

  it('shows factor scores', () => {
    render(<FinancialHealthCard data={excellentHealth} />);
    expect(screen.getByText('28/30')).toBeInTheDocument();
    expect(screen.getByText('25/25')).toBeInTheDocument();
  });

  it('has accessible score gauge', () => {
    render(<FinancialHealthCard data={excellentHealth} />);
    const gauge = screen.getByRole('img');
    expect(gauge).toHaveAttribute('aria-label', expect.stringContaining('90'));
  });

  it('renders null data without crashing', () => {
    const { container } = render(<FinancialHealthCard data={null} />);
    // Should show empty or loading state
    expect(container).toBeTruthy();
  });
});
