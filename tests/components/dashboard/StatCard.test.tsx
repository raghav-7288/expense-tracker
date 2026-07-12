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

  it('applies success variant', () => {
    const { container } = render(<StatCard title="Income" value="$500" icon={<span>📈</span>} variant="success" />);
    expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
  });

  it('applies danger variant', () => {
    const { container } = render(<StatCard title="Expenses" value="$500" icon={<span>📉</span>} variant="danger" />);
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<StatCard title="Balance" value="$500" icon={<span>💰</span>} />);
    expect(container.querySelector('.bg-gray-100')).toBeInTheDocument();
  });
});

