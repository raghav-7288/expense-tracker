import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import AccountsPage from '@/pages/AccountsPage';
import { buildAccount } from '@/test/factories';

vi.mock('@/hooks/useAccounts', () => ({
  useAccounts: vi.fn(),
  useAccountBalances: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useCreateAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => 'USD',
}));

import { useAccounts, useAccountBalances } from '@/hooks/useAccounts';
const mockUseAccounts = vi.mocked(useAccounts);
const mockUseAccountBalances = vi.mocked(useAccountBalances);

describe('AccountsPage', () => {
  it('shows skeleton when loading', () => {
    mockUseAccounts.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    const { container } = renderWithProviders(<AccountsPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows empty state when no accounts', () => {
    mockUseAccounts.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountsPage />);
    expect(screen.getByText('Track your money across accounts')).toBeInTheDocument();
    expect(screen.getByText(/Add your bank accounts/)).toBeInTheDocument();
  });

  it('renders account cards when data available', () => {
    const accounts = [
      buildAccount({ name: 'HDFC Savings', type: 'savings' }),
      buildAccount({ name: 'Cash Wallet', type: 'cash' }),
    ];
    mockUseAccounts.mockReturnValue({
      data: accounts,
      isLoading: false,
    } as never);
    mockUseAccountBalances.mockReturnValue({
      data: accounts.map((a) => ({ account: a, balance: Number(a.initial_balance) })),
      isLoading: false,
    } as never);

    renderWithProviders(<AccountsPage />);
    expect(screen.getByText('HDFC Savings')).toBeInTheDocument();
    expect(screen.getByText('Cash Wallet')).toBeInTheDocument();
    expect(screen.getByText('Total Net Worth')).toBeInTheDocument();
  });

  it('shows Add Account button in header', () => {
    mockUseAccounts.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountsPage />);
    expect(screen.getByRole('button', { name: /Add Your First Account/i })).toBeInTheDocument();
  });

  it('opens create modal on Add Account click', async () => {
    const user = userEvent.setup();
    mockUseAccounts.mockReturnValue({
      data: [buildAccount()],
      isLoading: false,
    } as never);
    mockUseAccountBalances.mockReturnValue({
      data: [{ account: buildAccount(), balance: 10000 }],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountsPage />);
    await user.click(screen.getByRole('button', { name: /Add Account/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Account' })).toBeInTheDocument();
    });
  });

  it('opens edit modal on edit button click', async () => {
    const user = userEvent.setup();
    const accounts = [buildAccount({ name: 'My Account' })];
    mockUseAccounts.mockReturnValue({
      data: accounts,
      isLoading: false,
    } as never);
    mockUseAccountBalances.mockReturnValue({
      data: [{ account: accounts[0]!, balance: 10000 }],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountsPage />);
    await user.click(screen.getByLabelText('Edit account'));

    await waitFor(() => {
      expect(screen.getByText('Edit Account')).toBeInTheDocument();
    });
  });

  it('opens delete confirmation on delete button click', async () => {
    const user = userEvent.setup();
    const accounts = [buildAccount({ name: 'Delete Me' })];
    mockUseAccounts.mockReturnValue({
      data: accounts,
      isLoading: false,
    } as never);
    mockUseAccountBalances.mockReturnValue({
      data: [{ account: accounts[0]!, balance: 5000 }],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountsPage />);
    await user.click(screen.getByLabelText('Delete account'));

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete this account/)).toBeInTheDocument();
    });
  });

  it('displays account type labels correctly', () => {
    const accounts = [
      buildAccount({ name: 'Card', type: 'credit_card' }),
    ];
    mockUseAccounts.mockReturnValue({
      data: accounts,
      isLoading: false,
    } as never);
    mockUseAccountBalances.mockReturnValue({
      data: [{ account: accounts[0]!, balance: -1500 }],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountsPage />);
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
  });
});


