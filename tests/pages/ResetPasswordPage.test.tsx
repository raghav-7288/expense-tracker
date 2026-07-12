import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

describe('ResetPasswordPage', () => {
  it('renders reset password form', () => {
    renderWithProviders(<ResetPasswordPage />, { auth: { user: null } });
    expect(screen.getByText('Reset password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
  });

  it('validates minimum password length', async () => {
    renderWithProviders(<ResetPasswordPage />, { auth: { user: null } });
    await userEvent.type(screen.getByLabelText('New Password'), '12');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    renderWithProviders(<ResetPasswordPage />, { auth: { user: null } });
    await userEvent.type(screen.getByLabelText('New Password'), 'pass123');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'different');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls updatePassword on valid submission', async () => {
    const updatePassword = vi.fn().mockResolvedValue({ error: null });
    renderWithProviders(<ResetPasswordPage />, { auth: { user: null, updatePassword } });
    await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith('newpass123');
    });
  });

  it('shows error on updatePassword failure', async () => {
    const updatePassword = vi.fn().mockResolvedValue({ error: new Error('Token expired') });
    renderWithProviders(<ResetPasswordPage />, { auth: { user: null, updatePassword } });
    await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument();
    });
  });
});

