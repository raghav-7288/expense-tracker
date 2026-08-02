import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import RecurringList from '@/components/recurring/RecurringList';
import type { RecurringTransaction } from '@/types';

const { mockUpdate, mockUpdateAsync, mockDeleteAsync } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockUpdateAsync: vi.fn().mockResolvedValue(undefined),
  mockDeleteAsync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/hooks/useRecurringTransactions', () => ({
  useUpdateRecurringTransaction: () => ({ mutate: mockUpdate, mutateAsync: mockUpdateAsync, isPending: false }),
  useDeleteRecurringTransaction: () => ({ mutateAsync: mockDeleteAsync, isPending: false }),
}));

vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));

// The edit modal renders RecurringForm; stub it (covered by its own suite).
vi.mock('@/components/recurring/RecurringForm', () => ({
  default: () => <div data-testid="recurring-form">Recurring form</div>,
}));

function rule(over: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: 'r1', user_id: 'u1', type: 'expense', amount: 1200, notes: 'Rent',
    category_id: 'c1', account_id: null, frequency: 'monthly',
    start_date: '2026-08-01', end_date: null, next_due_date: '2026-09-01',
    is_active: true, created_at: '', updated_at: '',
    categories: { id: 'c1', user_id: 'u1', name: 'Housing', type: 'expense', color: '#3b82f6', icon: 'home', created_at: '', updated_at: '' },
    account: null,
    ...over,
  };
}

describe('RecurringList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a rule with its notes, amount, and frequency', () => {
    renderWithProviders(<RecurringList rules={[rule()]} />);
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.getByText('-$1,200.00')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('shows the next due date for an active rule', () => {
    renderWithProviders(<RecurringList rules={[rule({ is_active: true })]} />);
    expect(screen.getByText(/Next:/)).toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });

  it('shows "Paused" for an inactive rule', () => {
    renderWithProviders(<RecurringList rules={[rule({ is_active: false })]} />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.queryByText(/Next:/)).not.toBeInTheDocument();
  });

  it('pauses an active rule (toggles is_active to false)', async () => {
    renderWithProviders(<RecurringList rules={[rule({ is_active: true })]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Pause recurring transaction' }));
    expect(mockUpdate).toHaveBeenCalledWith({ id: 'r1', input: { is_active: false } });
  });

  it('resumes a paused rule (toggles is_active to true)', async () => {
    renderWithProviders(<RecurringList rules={[rule({ is_active: false })]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Resume recurring transaction' }));
    expect(mockUpdate).toHaveBeenCalledWith({ id: 'r1', input: { is_active: true } });
  });

  it('opens the edit modal when Edit is clicked', async () => {
    renderWithProviders(<RecurringList rules={[rule()]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit recurring transaction' }));
    expect(await screen.findByTestId('recurring-form')).toBeInTheDocument();
  });

  it('deletes a rule after confirming in the dialog', async () => {
    renderWithProviders(<RecurringList rules={[rule()]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete recurring transaction' }));
    // ConfirmDialog opens with a "Delete" confirm button (distinct from the
    // card's "Delete recurring transaction" icon button).
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(mockDeleteAsync).toHaveBeenCalledWith('r1'));
  });

  it('renders an income rule with a positive sign and a paused end date', () => {
    renderWithProviders(
      <RecurringList rules={[rule({ type: 'income', amount: 5000, notes: 'Salary', end_date: '2027-01-01' })]} />,
    );
    expect(screen.getByText('Salary')).toBeInTheDocument();
    // Income rules render a leading '+' in the same span, so the node's
    // combined text is '+$5,000.00' (mirrors the '-$1,200.00' expense case).
    expect(screen.getByText('+$5,000.00')).toBeInTheDocument();
    expect(screen.getByText(/Ends/)).toBeInTheDocument();
  });
});


