import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Route, Routes } from 'react-router-dom';

describe('DashboardLayout', () => {
  it('renders navigation links', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Dashboard Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders the page content via Outlet', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Page Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('shows brand name', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    expect(screen.getAllByText('ExpenseTracker').length).toBeGreaterThanOrEqual(1);
  });

  it('has sign out button', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('has theme toggle', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    const toggles = screen.getAllByLabelText(/Switch to dark mode|Switch to light mode/);
    expect(toggles.length).toBeGreaterThanOrEqual(1);
  });

  it('displays user email in sidebar', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    // The email renders in the sidebar
    const emailEl = screen.getByText((content) => content.includes('test@'));
    expect(emailEl).toBeInTheDocument();
  });
});



