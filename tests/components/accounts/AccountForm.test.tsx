import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import AccountForm from '@/components/accounts/AccountForm';
import { buildAccount } from '@/test/factories';

describe('AccountForm', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  function renderForm(props: Partial<Parameters<typeof AccountForm>[0]> = {}) {
    return renderWithProviders(
      <AccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
        {...props}
      />,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    renderForm();

    expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Balance/i)).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('shows "Add Account" button for new accounts', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /Add Account/i })).toBeInTheDocument();
  });

  it('shows "Save Changes" button when editing', () => {
    renderForm({ initialData: buildAccount() });
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
  });

  it('pre-fills form when editing', () => {
    const account = buildAccount({ name: 'My Savings', type: 'savings', initial_balance: 5000 });
    renderForm({ initialData: account });

    expect(screen.getByDisplayValue('My Savings')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button clicked', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('validates name is required', async () => {
    const user = userEvent.setup();
    renderForm();

    // Clear name and submit
    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.clear(nameInput);
    await user.click(screen.getByRole('button', { name: /Add Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    renderForm();

    const nameInput = screen.getByLabelText(/Account Name/i);
    await user.type(nameInput, 'Test Account');

    const balanceInput = screen.getByLabelText(/Current Balance/i);
    await user.clear(balanceInput);
    await user.type(balanceInput, '25000');

    await user.click(screen.getByRole('button', { name: /Add Account/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Account',
          initial_balance: 25000,
          type: 'checking',
        }),
      );
    });
  });

  it('renders color picker with 10 options', () => {
    renderForm();
    const colorButtons = screen.getAllByRole('button', { name: /Select color/i });
    expect(colorButtons).toHaveLength(10);
  });

  it('shows loading state on submit button', () => {
    renderForm({ loading: true });
    const button = screen.getByRole('button', { name: /Add Account/i });
    expect(button).toBeDisabled();
  });
});

