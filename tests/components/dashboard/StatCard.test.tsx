import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '@/components/dashboard/StatCard';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Balance" value="$1,000.00" icon={<span>💰</span>} />);
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(<StatCard title="Income" value="$500" icon={<span>📈</span>} trend="This month" />);
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('applies success variant with gradient', () => {
    const { container } = render(<StatCard title="Income" value="$500" icon={<span>📈</span>} variant="success" />);
    const card = container.firstElementChild;
    expect(card?.className).toContain('from-emerald-500');
  });

  it('applies danger variant with gradient', () => {
    const { container } = render(<StatCard title="Expenses" value="$500" icon={<span>📉</span>} variant="danger" />);
    const card = container.firstElementChild;
    expect(card?.className).toContain('from-rose-500');
  });

  it('applies default variant with white bg', () => {
    const { container } = render(<StatCard title="Balance" value="$500" icon={<span>💰</span>} />);
    const card = container.firstElementChild;
    expect(card?.className).toContain('bg-white');
  });

  it('applies info variant', () => {
    const { container } = render(<StatCard title="Balance" value="$500" icon={<span>💰</span>} variant="info" />);
    const card = container.firstElementChild;
    expect(card?.className).toContain('from-primary-500');
  });
});
