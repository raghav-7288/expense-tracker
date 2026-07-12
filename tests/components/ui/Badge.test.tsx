import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders "Income" text for income type', () => {
    render(<Badge type="income" />);
    expect(screen.getByText('Income')).toBeInTheDocument();
  });

  it('renders "Expense" text for expense type', () => {
    render(<Badge type="expense" />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('applies green classes for income', () => {
    render(<Badge type="income" />);
    const badge = screen.getByText('Income');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-800');
  });

  it('applies red classes for expense', () => {
    render(<Badge type="expense" />);
    const badge = screen.getByText('Expense');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-800');
  });

  it('accepts custom className', () => {
    render(<Badge type="income" className="extra-class" />);
    const badge = screen.getByText('Income');
    expect(badge.className).toContain('extra-class');
  });
});

