import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('ChangePasswordForm', () => {
  it('renders password fields and submit button', () => {
    renderWithProviders(<ChangePasswordForm />);
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
  });

  it('shows password strength indicator when typing', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText('New Password'), 'abc');
    await waitFor(() => {
      expect(screen.getByText('weak')).toBeInTheDocument();
    });
  });

  it('shows strong for complex password', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText('New Password'), 'MyStr0ng!Pass');
    await waitFor(() => {
      expect(screen.getByText('strong')).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText('New Password'), 'abc');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('shows mismatch error when passwords differ', async () => {
    renderWithProviders(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText('New Password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'different123');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });
});

