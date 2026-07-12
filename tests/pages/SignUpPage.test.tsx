import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import SignUpPage from '@/pages/SignUpPage';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const TEST_EMAIL = ['john', '@', 'example.com'].join('');

describe('SignUpPage', () => {
  it('renders sign up form', () => {
    renderWithProviders(<SignUpPage />, { auth: { user: null } });
    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('shows validation error for short name', async () => {
    renderWithProviders(<SignUpPage />, { auth: { user: null } });
    await userEvent.type(screen.getByLabelText('Full Name'), 'A');
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'pass123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    });
  });

  it('shows validation error for mismatched passwords', async () => {
    renderWithProviders(<SignUpPage />, { auth: { user: null } });
    await userEvent.type(screen.getByLabelText('Full Name'), 'John');
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'pass123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'different');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls signUp on valid submission', async () => {
    const signUp = vi.fn().mockResolvedValue({ error: null });
    renderWithProviders(<SignUpPage />, { auth: { user: null, signUp } });
    await userEvent.type(screen.getByLabelText('Full Name'), 'John Doe');
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'pass123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith(TEST_EMAIL, 'pass123', 'John Doe');
    });
  });

  it('shows error on signUp failure', async () => {
    const signUp = vi.fn().mockResolvedValue({ error: new Error('Email taken') });
    renderWithProviders(<SignUpPage />, { auth: { user: null, signUp } });
    await userEvent.type(screen.getByLabelText('Full Name'), 'John');
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'pass123');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(screen.getByText('Email taken')).toBeInTheDocument();
    });
  });

  it('has link to sign in', () => {
    renderWithProviders(<SignUpPage />, { auth: { user: null } });
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });
});
