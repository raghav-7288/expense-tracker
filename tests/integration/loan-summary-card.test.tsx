/**
 * Tests that the LoanSummaryCard displays correct totals for
 * lent, borrowed, receivables, and payables on the dashboard.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import LoanSummaryCard from '@/components/loans/LoanSummaryCard';

vi.mock('@/hooks/useLoans', () => ({
  useLoanSummary: vi.fn(),
}));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));

import { useLoanSummary } from '@/hooks/useLoans';
const mockUseLoanSummary = vi.mocked(useLoanSummary);

describe('LoanSummaryCard – Dashboard Widget', () => {
  it('renders nothing when user has no loans', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        activeLoansCount: 0,
        settledLoansCount: 0,
        outstandingLent: 0,
        outstandingBorrowed: 0,
        netReceivable: 0,
        totalLent: 0,
        totalBorrowed: 0,
      },
      isLoading: false,
    } as never);

    const { container } = renderWithProviders(<LoanSummaryCard />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when summary data is null', () => {
    mockUseLoanSummary.mockReturnValue({
      data: null,
      isLoading: false,
    } as never);

    const { container } = renderWithProviders(<LoanSummaryCard />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading skeleton while fetching', () => {
    mockUseLoanSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as never);

    const { container } = renderWithProviders(<LoanSummaryCard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays receivable (outstanding lent) amount correctly', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 10000,
        totalBorrowed: 5000,
        outstandingLent: 7000,
        outstandingBorrowed: 3000,
        netReceivable: 4000,
        activeLoansCount: 3,
        settledLoansCount: 1,
      },
      isLoading: false,
    } as never);

    renderWithProviders(<LoanSummaryCard />);
    expect(screen.getByText('To receive')).toBeInTheDocument();
    expect(screen.getByText('$7,000.00')).toBeInTheDocument();
  });

  it('displays payable (outstanding borrowed) amount correctly', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 10000,
        totalBorrowed: 5000,
        outstandingLent: 7000,
        outstandingBorrowed: 3000,
        netReceivable: 4000,
        activeLoansCount: 3,
        settledLoansCount: 1,
      },
      isLoading: false,
    } as never);

    renderWithProviders(<LoanSummaryCard />);
    expect(screen.getByText('To pay back')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
  });

  it('displays positive net receivable with + prefix in green', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 10000,
        totalBorrowed: 2000,
        outstandingLent: 8000,
        outstandingBorrowed: 2000,
        netReceivable: 6000,
        activeLoansCount: 2,
        settledLoansCount: 0,
      },
      isLoading: false,
    } as never);

    const { container } = renderWithProviders(<LoanSummaryCard />);
    expect(screen.getByText('Net position')).toBeInTheDocument();
    expect(screen.getByText('+$6,000.00')).toBeInTheDocument();
    expect(container.querySelector('.text-emerald-600')).toBeInTheDocument();
  });

  it('displays negative net receivable in red (you owe more)', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 2000,
        totalBorrowed: 10000,
        outstandingLent: 1000,
        outstandingBorrowed: 8000,
        netReceivable: -7000,
        activeLoansCount: 2,
        settledLoansCount: 0,
      },
      isLoading: false,
    } as never);

    const { container } = renderWithProviders(<LoanSummaryCard />);
    expect(screen.getByText('-$7,000.00')).toBeInTheDocument();
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
  });

  it('displays active and settled loan counts', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 5000,
        totalBorrowed: 3000,
        outstandingLent: 2000,
        outstandingBorrowed: 1000,
        netReceivable: 1000,
        activeLoansCount: 4,
        settledLoansCount: 2,
      },
      isLoading: false,
    } as never);

    renderWithProviders(<LoanSummaryCard />);
    expect(screen.getByText('4 active · 2 settled')).toBeInTheDocument();
  });

  it('shows "View all" link to /loans page', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 5000,
        totalBorrowed: 0,
        outstandingLent: 5000,
        outstandingBorrowed: 0,
        netReceivable: 5000,
        activeLoansCount: 1,
        settledLoansCount: 0,
      },
      isLoading: false,
    } as never);

    renderWithProviders(<LoanSummaryCard />);
    const link = screen.getByText('View all');
    expect(link.closest('a')).toHaveAttribute('href', '/loans');
  });

  it('shows "Loan Summary" title', () => {
    mockUseLoanSummary.mockReturnValue({
      data: {
        totalLent: 1000, totalBorrowed: 500, outstandingLent: 1000,
        outstandingBorrowed: 500, netReceivable: 500, activeLoansCount: 1, settledLoansCount: 0,
      },
      isLoading: false,
    } as never);

    renderWithProviders(<LoanSummaryCard />);
    expect(screen.getByText('Loan Summary')).toBeInTheDocument();
  });
});

