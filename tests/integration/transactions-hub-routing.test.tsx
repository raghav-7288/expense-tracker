import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import TransactionsLayout from '@/layouts/TransactionsLayout';

// The mount-time recurring generator touches Supabase; stub it so this routing
// test is deterministic and network-free.
vi.mock('@/hooks/useRecurringTransactions', () => ({
  useGenerateDueTransactions: vi.fn(),
}));

// Simulates the browser's back/forward buttons via the history API.
function HistoryControls() {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate(-1)}>history-back</button>
      <button onClick={() => navigate(1)}>history-forward</button>
    </div>
  );
}

// Mirrors the protected group in src/routes/index.tsx (including the nested
// catch-all and legacy redirects) with stub leaf pages, so we exercise the real
// DashboardLayout + TransactionsLayout, nested routing, and redirects together.
function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/transactions" element={<TransactionsLayout />}>
          <Route index element={<div>All Transactions Page</div>} />
          <Route path="recurring" element={<div>Recurring Page</div>} />
          <Route path="loans" element={<div>Loans Page</div>} />
          <Route path="*" element={<Navigate to="/transactions" replace />} />
        </Route>
        <Route path="/recurring" element={<Navigate to="/transactions/recurring" replace />} />
        <Route path="/loans" element={<Navigate to="/transactions/loans" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function renderApp(route: string) {
  return renderWithProviders(
    <>
      <HistoryControls />
      <AppRoutes />
    </>,
    { route },
  );
}

/** The desktop breadcrumb title lives in the header (role=banner). */
function breadcrumb() {
  return within(screen.getByRole('banner'));
}

describe('Transactions hub routing (integration)', () => {
  it('deep-links directly to /transactions (All tab, sidebar + breadcrumb)', () => {
    renderApp('/transactions');
    expect(screen.getByText('All Transactions Page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
    // Sidebar "Transactions" item is highlighted.
    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute('aria-current', 'page');
    // Breadcrumb resolves to "Transactions".
    expect(breadcrumb().getByText('Transactions')).toBeInTheDocument();
  });

  it('deep-links directly to /transactions/recurring (longest-prefix breadcrumb + active tab)', () => {
    renderApp('/transactions/recurring');
    expect(screen.getByText('Recurring Page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recurring' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
    // Sidebar "Transactions" stays highlighted on the nested route.
    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute('aria-current', 'page');
    // Longest-prefix match → "Recurring", not "Transactions".
    expect(breadcrumb().getByText('Recurring')).toBeInTheDocument();
  });

  it('deep-links directly to /transactions/loans (longest-prefix breadcrumb + active tab)', () => {
    renderApp('/transactions/loans');
    expect(screen.getByText('Loans Page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loans' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current');
    expect(breadcrumb().getByText('Loans')).toBeInTheDocument();
  });

  it('legacy /recurring redirects into the hub', () => {
    renderApp('/recurring');
    expect(screen.getByText('Recurring Page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Recurring' })).toHaveAttribute('aria-current', 'page');
    expect(breadcrumb().getByText('Recurring')).toBeInTheDocument();
  });

  it('legacy /loans redirects into the hub', () => {
    renderApp('/loans');
    expect(screen.getByText('Loans Page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Loans' })).toHaveAttribute('aria-current', 'page');
    expect(breadcrumb().getByText('Loans')).toBeInTheDocument();
  });

  it('an unknown /transactions/* sub-path stays in the hub (falls back to All)', () => {
    // Without the nested catch-all this would bounce out to /dashboard.
    renderApp('/transactions/does-not-exist');
    expect(screen.getByText('All Transactions Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });

  it('supports tab switching and browser back/forward navigation', async () => {
    renderApp('/transactions');
    expect(screen.getByText('All Transactions Page')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Recurring' }));
    expect(screen.getByText('Recurring Page')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: 'Loans' }));
    expect(screen.getByText('Loans Page')).toBeInTheDocument();

    // Browser BACK → Recurring
    await userEvent.click(screen.getByRole('button', { name: 'history-back' }));
    await waitFor(() => expect(screen.getByText('Recurring Page')).toBeInTheDocument());

    // Browser BACK → All
    await userEvent.click(screen.getByRole('button', { name: 'history-back' }));
    await waitFor(() => expect(screen.getByText('All Transactions Page')).toBeInTheDocument());

    // Browser FORWARD → Recurring
    await userEvent.click(screen.getByRole('button', { name: 'history-forward' }));
    await waitFor(() => expect(screen.getByText('Recurring Page')).toBeInTheDocument());
  });
});


