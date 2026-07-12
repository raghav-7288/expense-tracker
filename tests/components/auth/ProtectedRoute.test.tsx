import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

describe('ProtectedRoute', () => {
  it('shows spinner when auth is loading', () => {
    renderWithProviders(
      <ProtectedRoute><div>Protected</div></ProtectedRoute>,
      { auth: { loading: true, user: null } }
    );
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    renderWithProviders(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute><div>Protected</div></ProtectedRoute>,
      { auth: { user: null, loading: false } }
    );
    expect(screen.queryByText('Protected')).not.toBeInTheDocument();
  });
});

