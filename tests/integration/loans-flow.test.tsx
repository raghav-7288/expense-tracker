/**
 * High-fidelity end-to-end tests for the Loans feature.
 *
 * Unlike LoansPage.test.tsx (which fully mocks the hooks + LoanList), this suite
 * mocks ONLY the service layer and renders the real LoansPage with the real
 * hooks against a real QueryClient. This exercises the actual React Query cache
 * interactions — the exact surface where the "delete loan" optimistic-update
 * crash lived (and went undetected because the unit tests ran with empty caches).
 *
 * Reproduces the real condition: BOTH the list cache (Loan[]) AND the summary
 * cache (LoanSummary object) are populated under the ['loans'] key prefix.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import LoansPage from '@/pages/LoansPage';
import type { Loan, LoanSummary } from '@/types';

// ---- Mock the service layer only; real hooks run against a real cache ----
const mockGetLoans = vi.fn();
const mockGetLoanSummary = vi.fn();
const mockDeleteLoan = vi.fn();
const mockRecordRepayment = vi.fn();
const mockUpdateLoan = vi.fn();
const mockCreateLoan = vi.fn();

vi.mock('@/services/loans', () => ({
  getLoans: (...a: unknown[]) => mockGetLoans(...a),
  getLoan: vi.fn(),
  createLoan: (...a: unknown[]) => mockCreateLoan(...a),
  updateLoan: (...a: unknown[]) => mockUpdateLoan(...a),
  deleteLoan: (...a: unknown[]) => mockDeleteLoan(...a),
  recordRepayment: (...a: unknown[]) => mockRecordRepayment(...a),
  getLoanTransactions: vi.fn(),
  getLoanSummary: (...a: unknown[]) => mockGetLoanSummary(...a),
}));

const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: mockToast }));
vi.mock('@/hooks/useCurrency', () => ({ useCurrency: () => 'USD' }));
vi.mock('@/hooks/useAccounts', () => ({ useAccounts: () => ({ data: [] }) }));

// ---- In-memory loan store backing the mocked service ----
let loansStore: Loan[] = [];

function makeLoan(over: Partial<Loan>): Loan {
  return {
    id: 'loan-x',
    user_id: 'user-123',
    counterparty_name: 'X',
    type: 'lent',
    principal_amount: 5000,
    outstanding_amount: 5000,
    status: 'active',
    due_date: '2026-09-01',
    notes: 'note',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    ...over,
  };
}

function computeSummary(loans: Loan[]): LoanSummary {
  const s: LoanSummary = {
    totalLent: 0, totalBorrowed: 0, outstandingLent: 0, outstandingBorrowed: 0,
    netReceivable: 0, activeLoansCount: 0, settledLoansCount: 0,
  };
  for (const l of loans) {
    if (l.type === 'lent') { s.totalLent += l.principal_amount; s.outstandingLent += l.outstanding_amount; }
    else { s.totalBorrowed += l.principal_amount; s.outstandingBorrowed += l.outstanding_amount; }
    if (l.status === 'settled') s.settledLoansCount++; else s.activeLoansCount++;
  }
  s.netReceivable = s.outstandingLent - s.outstandingBorrowed;
  return s;
}

beforeEach(() => {
  vi.clearAllMocks();
  loansStore = [
    makeLoan({ id: 'loan-1', counterparty_name: 'Rahul', type: 'lent', principal_amount: 5000, outstanding_amount: 3000, status: 'partially_paid' }),
    makeLoan({ id: 'loan-2', counterparty_name: 'Priya', type: 'borrowed', principal_amount: 10000, outstanding_amount: 10000, status: 'active' }),
  ];
  mockGetLoans.mockImplementation(async () => ({ data: [...loansStore], error: null }));
  mockGetLoanSummary.mockImplementation(async () => ({ data: computeSummary(loansStore), error: null }));
  mockDeleteLoan.mockImplementation(async (id: string) => {
    loansStore = loansStore.filter((l) => l.id !== id);
    return { error: null };
  });
});

describe('Loans feature – end-to-end (real hooks + real cache)', () => {
  it('loads loans and summary together (both caches under ["loans"])', async () => {
    renderWithProviders(<LoansPage />);

    expect(await screen.findByText('Rahul')).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    // Summary section rendered from the summary OBJECT cache
    expect(screen.getByText('To Receive')).toBeInTheDocument();
    expect(screen.getByText('To Pay Back')).toBeInTheDocument();
  });

  it('deletes a loan without crashing on the summary cache (delete-bug regression)', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<LoansPage />);
    await screen.findByText('Rahul');

    // Open the first loan's actions menu and delete it
    await user.click(screen.getAllByRole('button', { name: /loan actions/i })[0]);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    // The service delete ran (would NOT run if onMutate crashed on the summary cache)
    await waitFor(() => expect(mockDeleteLoan).toHaveBeenCalledWith('loan-1'));

    // Loan card removed, the other remains, summary still rendered (no crash)
    await waitFor(() => expect(screen.queryByText('Rahul')).not.toBeInTheDocument());
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText('To Receive')).toBeInTheDocument();

    // No failure toast; success toast shown
    expect(mockToast.error).not.toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith('Loan deleted');

    confirmSpy.mockRestore();
  });

  it('records a repayment for a lent loan through the UI', async () => {
    const user = userEvent.setup();
    mockRecordRepayment.mockImplementation(async (input: { loan_id: string; amount: number }) => {
      const loan = loansStore.find((l) => l.id === input.loan_id)!;
      const updated = { ...loan, outstanding_amount: loan.outstanding_amount - input.amount, status: 'partially_paid' as const };
      loansStore = loansStore.map((l) => (l.id === input.loan_id ? updated : l));
      return { data: updated, error: null };
    });

    renderWithProviders(<LoansPage />);
    await screen.findByText('Rahul');

    // Use the quick "Record Repayment" button on the first (lent) card
    await user.click(screen.getAllByRole('button', { name: /record repayment/i })[0]);

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Repayment amount'), '1000');
    await user.click(within(dialog).getByRole('button', { name: /record repayment/i }));

    await waitFor(() =>
      expect(mockRecordRepayment).toHaveBeenCalledWith(
        expect.objectContaining({ loan_id: 'loan-1', amount: 1000 }),
      ),
    );
    expect(mockToast.success).toHaveBeenCalledWith('Repayment recorded');
  });

  it('edits a loan and sends only editable fields', async () => {
    const user = userEvent.setup();
    mockUpdateLoan.mockImplementation(async (id: string, input: Record<string, unknown>) => {
      const loan = loansStore.find((l) => l.id === id)!;
      const updated = { ...loan, ...input };
      loansStore = loansStore.map((l) => (l.id === id ? updated : l));
      return { data: updated, error: null };
    });

    renderWithProviders(<LoansPage />);
    await screen.findByText('Rahul');

    await user.click(screen.getAllByRole('button', { name: /loan actions/i })[0]);
    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/person name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Rahul Kumar');
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockUpdateLoan).toHaveBeenCalledWith(
        'loan-1',
        expect.objectContaining({ counterparty_name: 'Rahul Kumar' }),
      ),
    );
    // Type/principal are NOT part of the update payload (locked in edit mode)
    const payload = mockUpdateLoan.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('type');
    expect(payload).not.toHaveProperty('principal_amount');
  });
});





