import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartInsights from '@/components/analytics/SmartInsights';
import type { InsightItem } from '@/types/analytics';

describe('SmartInsights', () => {
  const insights: InsightItem[] = [
    { id: '1', type: 'info', message: 'You spend most on Food', detail: '35% of expenses' },
    { id: '2', type: 'success', message: 'Great savings rate of 25%!' },
    { id: '3', type: 'warning', message: 'Spending increased by 30%', detail: 'Higher than previous period' },
    { id: '4', type: 'tip', message: 'Rent represents 40% of expenses', detail: 'Consider reducing' },
  ];

  it('renders all insights', () => {
    render(<SmartInsights data={insights} />);
    expect(screen.getByText('You spend most on Food')).toBeInTheDocument();
    expect(screen.getByText('Great savings rate of 25%!')).toBeInTheDocument();
    expect(screen.getByText('Spending increased by 30%')).toBeInTheDocument();
    expect(screen.getByText('Rent represents 40% of expenses')).toBeInTheDocument();
  });

  it('renders detail text when provided', () => {
    render(<SmartInsights data={insights} />);
    expect(screen.getByText('35% of expenses')).toBeInTheDocument();
  });

  it('renders empty state when no insights', () => {
    render(<SmartInsights data={[]} />);
    expect(screen.getByText(/Add more transactions/)).toBeInTheDocument();
  });
});
