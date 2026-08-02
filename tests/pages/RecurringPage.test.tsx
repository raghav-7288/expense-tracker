import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import RecurringPage from '@/pages/RecurringPage';

// Handle to the create mutation so we can assert the page's submit wiring.
const { mockCreateMutateAsync } = vi.hoisted(() => ({ mockCreateMutateAsync: vi.fn() }));

vi.mock('@/hooks/useRecurringTransactions', () => ({
  useRecurringTransactions: vi.fn(),
  useCreateRecurringTransaction: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
}));

// Keep the page test focused: stub the list + form children (covered by their own suites).
vi.mock('@/components/recurring/RecurringList', () => ({
  default: ({ rules }: { rules: unknown[] }) => (
    <div data-testid="recurring-list">Rules: {rules.length}</div>
  ),
}));

vi.mock('@/components/recurring/RecurringForm', () => ({
  default: ({ onSubmit }: { onSubmit: (d: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          type: 'expense',
          amount: 100,
          notes: 'Rent',
          category_id: 'c1',
          account_id: 'a1',
          frequency: 'monthly',
          start_date: '2026-08-01',
          end_date: null,
        })
      }
    >
      mock-submit
    </button>
  ),
}));

import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
const mockUseRecurring = vi.mocked(useRecurringTransactions);

describe('RecurringPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while rules are loading', () => {
    mockUseRecurring.mockReturnValue({
      data: undefined, isLoading: true, isError: false, refetch: vi.fn(),
    } as never);

    const { container } = renderWithProviders(<RecurringPage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state on failure', () => {
    mockUseRecurring.mockReturnValue({
      data: undefined, isLoading: false, isError: true, refetch: vi.fn(),
    } as never);

    renderWithProviders(<RecurringPage />);
    expect(screen.getByText('Failed to load recurring transactions')).toBeInTheDocument();
  });

  it('shows the empty state when there are no rules', () => {
    mockUseRecurring.mockReturnValue({
      data: [], isLoading: false, isError: false, refetch: vi.fn(),
    } as never);

    renderWithProviders(<RecurringPage />);
    expect(screen.getByText('No recurring transactions yet')).toBeInTheDocument();
  });

  it('renders the list when rules exist', () => {
    mockUseRecurring.mockReturnValue({
      data: [{ id: 'r1' }, { id: 'r2' }], isLoading: false, isError: false, refetch: vi.fn(),
    } as never);

    renderWithProviders(<RecurringPage />);
    expect(screen.getByTestId('recurring-list')).toBeInTheDocument();
    expect(screen.getByText('Rules: 2')).toBeInTheDocument();
  });

  it('renders the page header (title + description)', () => {
    mockUseRecurring.mockReturnValue({
      data: [], isLoading: false, isError: false, refetch: vi.fn(),
    } as never);

    renderWithProviders(<RecurringPage />);
    expect(screen.getByText('Recurring')).toBeInTheDocument();
    expect(screen.getByText('Automate transactions that repeat on a schedule')).toBeInTheDocument();
  });

  it('submitting the form forwards the mapped payload to the create mutation', async () => {
    mockCreateMutateAsync.mockResolvedValue({ id: 'r-new' });
    mockUseRecurring.mockReturnValue({
      data: [], isLoading: false, isError: false, refetch: vi.fn(),
    } as never);

    renderWithProviders(<RecurringPage />);

    // Open the "New Recurring Transaction" modal, then submit via the stubbed form.
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await userEvent.click(await screen.findByRole('button', { name: 'mock-submit' }));

    await waitFor(() =>
      expect(mockCreateMutateAsync).toHaveBeenCalledWith({
        type: 'expense',
        amount: 100,
        notes: 'Rent',
        category_id: 'c1',
        account_id: 'a1',
        frequency: 'monthly',
        start_date: '2026-08-01',
        end_date: null,
      }),
    );
  });
});

