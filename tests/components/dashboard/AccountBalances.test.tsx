import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import AccountBalances from '@/components/dashboard/AccountBalances';
import { buildAccount } from '@/test/factories';

vi.mock('@/hooks/useAccounts', () => ({
  useAccountBalances: vi.fn(),
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => 'USD',
}));

import { useAccountBalances } from '@/hooks/useAccounts';
const mockUseAccountBalances = vi.mocked(useAccountBalances);

describe('AccountBalances', () => {
  it('renders nothing when user has no accounts', () => {
    mockUseAccountBalances.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);

    const { container } = renderWithProviders(<AccountBalances />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading skeleton while fetching', () => {
    mockUseAccountBalances.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    const { container } = renderWithProviders(<AccountBalances />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays account names and balances', () => {
    const accounts = [
      buildAccount({ name: 'HDFC Savings' }),
      buildAccount({ name: 'SBI Current' }),
    ];
    mockUseAccountBalances.mockReturnValue({
      data: [
        { account: accounts[0]!, balance: 50000 },
        { account: accounts[1]!, balance: 120000 },
      ],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountBalances />);
    expect(screen.getByText('HDFC Savings')).toBeInTheDocument();
    expect(screen.getByText('SBI Current')).toBeInTheDocument();
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
  });

  it('shows "View All" link to accounts page', () => {
    const account = buildAccount({ name: 'Test' });
    mockUseAccountBalances.mockReturnValue({
      data: [{ account, balance: 1000 }],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountBalances />);
    const link = screen.getByText('View All');
    expect(link.closest('a')).toHaveAttribute('href', '/accounts');
  });

  it('shows "+N more" when more than 4 accounts', () => {
    const accounts = Array.from({ length: 6 }, (_, i) =>
      buildAccount({ name: `Account ${i + 1}` }),
    );
    mockUseAccountBalances.mockReturnValue({
      data: accounts.map((a) => ({ account: a, balance: 1000 })),
      isLoading: false,
    } as never);

    renderWithProviders(<AccountBalances />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('displays Accounts header with icon', () => {
    const account = buildAccount({ name: 'My Account' });
    mockUseAccountBalances.mockReturnValue({
      data: [{ account, balance: 5000 }],
      isLoading: false,
    } as never);

    renderWithProviders(<AccountBalances />);
    expect(screen.getByText('Accounts')).toBeInTheDocument();
  });
});

