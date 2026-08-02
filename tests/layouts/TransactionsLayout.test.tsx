import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { Routes, Route } from 'react-router-dom';
import TransactionsLayout from '@/layouts/TransactionsLayout';

/**
 * Exercises the hub tab bar in isolation with lightweight stub child routes,
 * so the focus is purely on tab rendering / active state / nested outlet.
 */
function HubRoutes() {
  return (
    <Routes>
      <Route path="/transactions" element={<TransactionsLayout />}>
        <Route index element={<div>All Transactions View</div>} />
        <Route path="recurring" element={<div>Recurring View</div>} />
        <Route path="loans" element={<div>Loans View</div>} />
      </Route>
    </Routes>
  );
}

describe('TransactionsLayout (hub tab bar)', () => {
  it('renders all three tabs with an accessible nav label', () => {
    renderWithProviders(<HubRoutes />, { route: '/transactions' });
    expect(screen.getByRole('navigation', { name: 'Transaction views' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recurring' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loans' })).toBeInTheDocument();
  });

  it('renders the index (All) view at /transactions with only the All tab active', () => {
    renderWithProviders(<HubRoutes />, { route: '/transactions' });
    expect(screen.getByText('All Transactions View')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Recurring' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Loans' })).not.toHaveAttribute('aria-current');
  });

  it('renders the Recurring view — and the All tab is NOT active on a sub-route (end=true)', () => {
    renderWithProviders(<HubRoutes />, { route: '/transactions/recurring' });
    expect(screen.getByText('Recurring View')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recurring' })).toHaveAttribute('aria-current', 'page');
    // Regression guard: without end=true the parent "All" tab would stay highlighted here.
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Loans' })).not.toHaveAttribute('aria-current');
  });

  it('renders the Loans view with only the Loans tab active', () => {
    renderWithProviders(<HubRoutes />, { route: '/transactions/loans' });
    expect(screen.getByText('Loans View')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loans' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
  });

  it('switches views on tab click (All → Recurring → Loans → All)', async () => {
    renderWithProviders(<HubRoutes />, { route: '/transactions' });
    expect(screen.getByText('All Transactions View')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Recurring' }));
    expect(screen.getByText('Recurring View')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Loans' }));
    expect(screen.getByText('Loans View')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'All' }));
    expect(screen.getByText('All Transactions View')).toBeInTheDocument();
  });
});

