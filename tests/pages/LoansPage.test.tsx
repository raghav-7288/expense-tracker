import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import LoansPage from '@/pages/LoansPage';

vi.mock('@/hooks/useLoans', () => ({
  useLoans: vi.fn(),
  useCreateLoan: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useLoanSummary: vi.fn(),
}));

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => 'USD',
}));

vi.mock('@/components/loans/LoanList', () => ({
  default: ({ loans }: { loans: unknown[] }) => (
    <div data-testid="loan-list">Loans: {loans.length}</div>
  ),
}));

vi.mock('@/components/loans/LoanFilterBar', () => ({
  default: () => <div data-testid="loan-filter-bar">Filters</div>,
}));

import { useLoans, useLoanSummary } from '@/hooks/useLoans';
const mockUseLoans = vi.mocked(useLoans);
const mockUseLoanSummary = vi.mocked(useLoanSummary);

describe('LoansPage', () => {
  it('shows loading skeleton when data is loading', () => {
    mockUseLoans.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseLoanSummary.mockReturnValue({ data: null } as never);

    const { container } = renderWithProviders(<LoansPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state on failure', () => {
    mockUseLoans.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as never);
    mockUseLoanSummary.mockReturnValue({ data: null } as never);

    renderWithProviders(<LoansPage />);
    expect(screen.getByText('Failed to load loans')).toBeInTheDocument();
  });

  it('shows empty state when no loans exist', () => {
    mockUseLoans.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseLoanSummary.mockReturnValue({ data: null } as never);

    renderWithProviders(<LoansPage />);
    expect(screen.getByText('No loans yet')).toBeInTheDocument();
    expect(screen.getByText(/Start tracking money/)).toBeInTheDocument();
  });

  it('renders loan list when loans exist', () => {
    const loans = [
      { id: 'loan-1', counterparty_name: 'Rahul', type: 'lent', principal_amount: 5000, outstanding_amount: 3000, status: 'partially_paid' },
      { id: 'loan-2', counterparty_name: 'Priya', type: 'borrowed', principal_amount: 10000, outstanding_amount: 10000, status: 'active' },
    ];
    mockUseLoans.mockReturnValue({
      data: loans,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 5000,
        totalBorrowed: 10000,
        outstandingLent: 3000,
        outstandingBorrowed: 10000,
        netReceivable: -7000,
        activeLoansCount: 2,
        settledLoansCount: 0,
      },
    } as never);

    renderWithProviders(<LoansPage />);
    expect(screen.getByTestId('loan-list')).toBeInTheDocument();
    expect(screen.getByText('Loans: 2')).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    mockUseLoans.mockReturnValue({
      data: [{ id: 'loan-1' }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 5000,
        totalBorrowed: 10000,
        outstandingLent: 3000,
        outstandingBorrowed: 10000,
        netReceivable: -7000,
        activeLoansCount: 2,
        settledLoansCount: 0,
      },
    } as never);

    renderWithProviders(<LoansPage />);
    expect(screen.getByText('To Receive')).toBeInTheDocument();
    expect(screen.getByText('To Pay Back')).toBeInTheDocument();
    expect(screen.getByText('Net Position')).toBeInTheDocument();
  });

  it('shows page header with title and action', () => {
    mockUseLoans.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    mockUseLoanSummary.mockReturnValue({ data: null } as never);

    renderWithProviders(<LoansPage />);
    expect(screen.getByText('Loans')).toBeInTheDocument();
    expect(screen.getByText('Track money lent and borrowed')).toBeInTheDocument();
  });
});

