/**
 * Component tests for the LoanList edit flow.
 *
 * Verifies the newly wired-up "Edit" action:
 * 1. The actions menu exposes an Edit option that opens the edit modal
 * 2. The edit form is in edit mode (locked type/amount, "Save Changes")
 * 3. Submitting calls updateLoan with ONLY the editable fields
 *    (counterparty_name / due_date / notes) — never type or principal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import LoanList from '@/components/loans/LoanList';
import type { Loan } from '@/types';

const updateMutate = vi.fn().mockResolvedValue({});
const deleteMutate = vi.fn();
const repayMutate = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useLoans', () => ({
  useDeleteLoan: () => ({ mutate: deleteMutate, isPending: false }),
  useUpdateLoan: () => ({ mutateAsync: updateMutate, isPending: false }),
  useRecordRepayment: () => ({ mutateAsync: repayMutate, isPending: false }),
}));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('@/hooks/useAccounts', () => ({ useAccounts: () => ({ data: [] }) }));

const lentLoan: Loan = {
  id: 'loan-1',
  user_id: 'user-1',
  counterparty_name: 'Rahul',
  type: 'lent',
  principal_amount: 5000,
  outstanding_amount: 3000,
  status: 'partially_paid',
  due_date: '2026-09-01',
  notes: 'Rent deposit',
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-01T10:00:00Z',
};

describe('LoanList – edit flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the edit modal in edit mode with locked type/amount', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanList loans={[lentLoan]} />);

    await user.click(screen.getByRole('button', { name: /loan actions/i }));
    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    // Edit modal opens with the "Save Changes" affordance
    expect(await screen.findByRole('button', { name: /save changes/i })).toBeInTheDocument();
    // Edit-mode lock hint is shown for the loan type
    expect(screen.getByText(/loan type can't be changed/i)).toBeInTheDocument();
    // Amount is pre-filled and read-only
    const amount = screen.getByLabelText('Amount') as HTMLInputElement;
    expect(amount.value).toBe('5000');
    expect(amount).toHaveAttribute('readonly');
  });

  it('submits only editable fields to updateLoan', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoanList loans={[lentLoan]} />);

    await user.click(screen.getByRole('button', { name: /loan actions/i }));
    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    const nameInput = await screen.findByLabelText(/person name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Rahul Kumar');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate).toHaveBeenCalledWith({
      id: 'loan-1',
      input: {
        counterparty_name: 'Rahul Kumar',
        due_date: '2026-09-01',
        notes: 'Rent deposit',
      },
    });
  });
});

describe('LoanList – display & status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows repayment progress for a partially-paid loan', () => {
    renderWithProviders(<LoanList loans={[lentLoan]} />);
    // (5000 - 3000) / 5000 = 40%
    expect(screen.getByText(/40% repaid/i)).toBeInTheDocument();
    expect(screen.getByText(/Partial/i)).toBeInTheDocument();
  });

  it('flags an overdue loan', () => {
    const overdue = { ...lentLoan, id: 'loan-od', due_date: '2020-01-01', status: 'active' as const };
    renderWithProviders(<LoanList loans={[overdue]} />);
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it('hides repayment actions and progress for a settled loan', () => {
    const settled = { ...lentLoan, id: 'loan-s', outstanding_amount: 0, status: 'settled' as const };
    renderWithProviders(<LoanList loans={[settled]} />);
    expect(screen.getByText(/Settled/i)).toBeInTheDocument();
    // No repayment affordance once settled
    expect(screen.queryByRole('button', { name: /record repayment/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/repaid/i)).not.toBeInTheDocument();
  });
});

