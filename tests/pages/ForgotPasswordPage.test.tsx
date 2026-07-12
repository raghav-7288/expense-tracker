import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const TEST_EMAIL = ['user', '@', 'example.com'].join('');

describe('ForgotPasswordPage', () => {
  it('renders forgot password form', () => {
    renderWithProviders(<ForgotPasswordPage />, { auth: { user: null } });
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('validates email', async () => {
    renderWithProviders(<ForgotPasswordPage />, { auth: { user: null } });
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  it('calls resetPassword on valid submission', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: null });
    renderWithProviders(<ForgotPasswordPage />, { auth: { user: null, resetPassword } });
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith(TEST_EMAIL);
    });
  });

  it('shows success state after sending', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: null });
    renderWithProviders(<ForgotPasswordPage />, { auth: { user: null, resetPassword } });
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });
  });

  it('shows error on resetPassword failure', async () => {
    const resetPassword = vi.fn().mockResolvedValue({ error: new Error('User not found') });
    renderWithProviders(<ForgotPasswordPage />, { auth: { user: null, resetPassword } });
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('has back to sign in link', () => {
    renderWithProviders(<ForgotPasswordPage />, { auth: { user: null } });
    expect(screen.getByText('Back to sign in')).toBeInTheDocument();
  });
});
