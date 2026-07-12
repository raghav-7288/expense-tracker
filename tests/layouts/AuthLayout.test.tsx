import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import AuthLayout from '@/layouts/AuthLayout';
import { Route, Routes } from 'react-router-dom';

describe('AuthLayout', () => {
  it('redirects to /dashboard when user is authenticated', () => {
    // When user is present, it should redirect
    renderWithProviders(
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<div>Login Form</div>} />
        </Route>
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>,
      { route: '/login' }
    );
    // User is authenticated by default in test utils
    expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
  });

  it('shows spinner when loading', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<div>Login Form</div>} />
        </Route>
      </Routes>,
      { auth: { loading: true, user: null }, route: '/login' }
    );
    expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
  });

  it('renders outlet when user is null and not loading', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<div>Login Form</div>} />
        </Route>
      </Routes>,
      { auth: { user: null, loading: false }, route: '/login' }
    );
    expect(screen.getByText('Login Form')).toBeInTheDocument();
    expect(screen.getByText('ExpenseTracker')).toBeInTheDocument();
  });

  it('has a theme toggle button', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<div>Login</div>} />
        </Route>
      </Routes>,
      { auth: { user: null, loading: false }, route: '/login' }
    );
    expect(screen.getByLabelText(/Switch to dark mode|Switch to light mode/)).toBeInTheDocument();
  });
});

