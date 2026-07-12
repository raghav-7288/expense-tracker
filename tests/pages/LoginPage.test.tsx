import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import LoginPage from '@/pages/LoginPage';

const TEST_EMAIL = ['user', '@', 'example.com'].join('');

describe('LoginPage', () => {
  it('renders login form', () => {
    renderWithProviders(<LoginPage />, { auth: { user: null } });
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows validation errors for empty submission', async () => {
    renderWithProviders(<LoginPage />, { auth: { user: null } });
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
    });
  });

  it('shows password validation', async () => {
    renderWithProviders(<LoginPage />, { auth: { user: null } });
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('calls signIn on valid submission', async () => {
    const signIn = vi.fn().mockResolvedValue({ error: null });
    renderWithProviders(<LoginPage />, { auth: { user: null, signIn } });
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(TEST_EMAIL, 'password123');
    });
  });

  it('shows error message on signIn failure', async () => {
    const signIn = vi.fn().mockResolvedValue({ error: new Error('Invalid credentials') });
    renderWithProviders(<LoginPage />, { auth: { user: null, signIn } });
    await userEvent.type(screen.getByLabelText('Email'), TEST_EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('has link to forgot password', () => {
    renderWithProviders(<LoginPage />, { auth: { user: null } });
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });

  it('has link to sign up', () => {
    renderWithProviders(<LoginPage />, { auth: { user: null } });
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });
});
