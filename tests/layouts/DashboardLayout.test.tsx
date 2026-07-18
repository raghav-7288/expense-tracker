import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    // Dashboard appears in nav + breadcrumb
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
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

  it('displays user info in sidebar', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    // The user name or email renders in the sidebar footer
    const userEl = screen.getByText((content) => content.includes('Test User') || content.includes('test@'));
    expect(userEl).toBeInTheDocument();
  });

  it('calls signOut and navigates to login when Sign Out clicked', async () => {
    const { authValue } = renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: '/dashboard' }
    );

    await userEvent.click(screen.getByText('Sign Out'));
    await waitFor(() => {
      expect(authValue.signOut).toHaveBeenCalled();
    });
  });

  it('opens mobile sidebar when hamburger clicked', async () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );

    const openBtn = screen.getByLabelText('Open navigation');
    await userEvent.click(openBtn);
    // Close sidebar button should become visible
    expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
  });

  it('toggles dark mode on theme button click', async () => {
    const { themeValue } = renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );

    const toggles = screen.getAllByLabelText(/Switch to dark mode|Switch to light mode/);
    await userEvent.click(toggles[0]!);
    expect(themeValue.setDarkMode).toHaveBeenCalledWith(true);
  });

  it('renders skip to content link for accessibility', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    expect(screen.getByText('Skip to content')).toBeInTheDocument();
  });

  it('has analytics navigation link', () => {
    renderWithProviders(
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<div>Content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
});



