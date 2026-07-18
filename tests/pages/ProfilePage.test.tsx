import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUser } from '@/test/test-utils';
import ProfilePage from '@/pages/ProfilePage';
import type { User } from '@supabase/supabase-js';

/* ---------- mocks ---------- */

const {
  mockMutateAsync,
  mockToast,
  mockGenerateCSV,
  mockDownloadFile,
  mockTransactionsRef,
  mockIsPendingRef,
} = vi.hoisted(() => ({
  mockMutateAsync: vi.fn().mockResolvedValue({}),
  mockToast: { success: vi.fn(), error: vi.fn() },
  mockGenerateCSV: vi.fn().mockReturnValue('Date,Type\n2024-06-15,expense'),
  mockDownloadFile: vi.fn(),
  mockTransactionsRef: { current: undefined as unknown },
  mockIsPendingRef: { current: false },
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
  useUpdateProfile: () => ({ mutateAsync: mockMutateAsync, isPending: mockIsPendingRef.current }),
}));

const mockTransactions = [
  {
    id: '1', type: 'expense', amount: 50, description: 'Groceries', date: '2024-06-15',
    user_id: 'u1', category_id: 'cat-1', notes: null, created_at: '', updated_at: '',
    categories: { id: 'cat-1', user_id: 'u1', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '' },
  },
  {
    id: '2', type: 'income', amount: 2000, description: 'Salary', date: '2024-06-01',
    user_id: 'u1', category_id: 'cat-2', notes: 'Monthly', created_at: '', updated_at: '',
    categories: { id: 'cat-2', user_id: 'u1', name: 'Salary', type: 'income', color: '#10b981', icon: 'dollar-sign', created_at: '', updated_at: '' },
  },
];

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: () => ({ data: mockTransactionsRef.current }),
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));

vi.mock('react-hot-toast', () => ({ default: mockToast }));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: vi.fn().mockResolvedValue({ error: null }) },
}));

vi.mock('@/engines/analytics', () => ({
  generateCSV: (...args: unknown[]) => mockGenerateCSV(...args),
  downloadFile: (...args: unknown[]) => mockDownloadFile(...args),
}));

import { useProfile } from '@/hooks/useProfile';
const mockUseProfile = vi.mocked(useProfile);

/* ---------- fixtures ---------- */

const defaultProfile = {
  id: 'user-123',
  email: '[REDACTED_EMAIL_ADDRESS_1]',
  full_name: 'Test User',
  currency: 'USD',
  avatar_url: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-06-15T10:00:00Z',
};

function setupLoaded(profileOverrides = {}, opts: { darkMode?: boolean; authOverrides?: Record<string, unknown> } = {}) {
  mockUseProfile.mockReturnValue({
    data: { ...defaultProfile, ...profileOverrides },
    isLoading: false,
  } as never);
  return renderWithProviders(<ProfilePage />, {
    darkMode: opts.darkMode ?? false,
    auth: opts.authOverrides as never,
  });
}

/* ---------- tests ---------- */

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPendingRef.current = false;
    mockTransactionsRef.current = mockTransactions;
  });

  /* ==================== Loading ==================== */

  describe('Loading state', () => {
    it('shows skeleton loader while profile data is loading', () => {
      mockUseProfile.mockReturnValue({ data: undefined, isLoading: true } as never);
      const { container } = renderWithProviders(<ProfilePage />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('does not render profile form while loading', () => {
      mockUseProfile.mockReturnValue({ data: undefined, isLoading: true } as never);
      renderWithProviders(<ProfilePage />);
      expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
    });
  });

  /* ==================== Page header ==================== */

  describe('Page header', () => {
    it('renders page title and description', () => {
      setupLoaded();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Manage your account settings')).toBeInTheDocument();
    });
  });

  /* ==================== Avatar & user info ==================== */

  describe('Avatar and user info', () => {
    it('displays first letter of full name as avatar initial', () => {
      setupLoaded({ full_name: 'Jane Doe' });
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('displays first letter of email when full_name is null', () => {
      setupLoaded({ full_name: null });
      // mockUser.email starts with "t" → initial "T"
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('displays "U" as fallback when both name and email are absent', () => {
      setupLoaded({ full_name: null }, { authOverrides: { user: { ...mockUser, email: undefined } as unknown as User } });
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('uppercases the initial', () => {
      setupLoaded({ full_name: 'lowercase user' });
      expect(screen.getByText('L')).toBeInTheDocument();
    });

    it('renders user full name in header', () => {
      setupLoaded({ full_name: 'John Doe' });
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders "User" when full_name is empty string', () => {
      setupLoaded({ full_name: '' });
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('renders user email from auth context', () => {
      setupLoaded();
      const emailTexts = screen.getAllByText(/test.*example\.com/i);
      expect(emailTexts.length).toBeGreaterThan(0);
    });
  });

  /* ==================== Profile form ==================== */

  describe('Profile form', () => {
    it('renders Full Name input pre-filled', () => {
      setupLoaded();
      expect(screen.getByLabelText('Full Name')).toHaveValue('Test User');
    });

    it('renders Currency select pre-filled with profile currency', () => {
      setupLoaded({ currency: 'EUR' });
      expect(screen.getByLabelText('Currency')).toHaveValue('EUR');
    });

    it('renders all currency options', () => {
      setupLoaded();
      const select = screen.getByLabelText('Currency');
      const options = within(select).getAllByRole('option');
      // 20 currencies in CURRENCIES constant
      expect(options.length).toBe(20);
    });

    it('disables Save Changes when form is pristine', () => {
      setupLoaded();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    });

    it('enables Save Changes when full name is changed', async () => {
      setupLoaded();
      const input = screen.getByLabelText('Full Name');
      await userEvent.clear(input);
      await userEvent.type(input, 'New Name');
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    });

    it('enables Save Changes when currency is changed', async () => {
      setupLoaded();
      await userEvent.selectOptions(screen.getByLabelText('Currency'), 'EUR');
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    });

    it('calls mutateAsync with updated values on submit', async () => {
      setupLoaded();
      const input = screen.getByLabelText('Full Name');
      await userEvent.clear(input);
      await userEvent.type(input, 'Updated Name');
      await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          full_name: 'Updated Name',
          currency: 'USD',
        });
      });
    });

    it('calls mutateAsync with changed currency on submit', async () => {
      setupLoaded();
      await userEvent.selectOptions(screen.getByLabelText('Currency'), 'INR');
      await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ currency: 'INR' }),
        );
      });
    });

    it('shows validation error when full name is cleared and submitted', async () => {
      setupLoaded();
      const input = screen.getByLabelText('Full Name');
      await userEvent.clear(input);
      await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('does not call mutateAsync when validation fails', async () => {
      setupLoaded();
      await userEvent.clear(screen.getByLabelText('Full Name'));
      await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  /* ==================== Appearance / dark mode ==================== */

  describe('Appearance section', () => {
    it('renders Appearance heading', () => {
      setupLoaded();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    it('renders Dark Mode label', () => {
      setupLoaded();
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    });

    it('shows "Light theme is active" in light mode', () => {
      setupLoaded({}, { darkMode: false });
      expect(screen.getByText('Light theme is active')).toBeInTheDocument();
    });

    it('shows "Dark theme is active" in dark mode', () => {
      setupLoaded({}, { darkMode: true });
      expect(screen.getByText('Dark theme is active')).toBeInTheDocument();
    });

    it('toggle has role="switch" and correct aria-checked in light mode', () => {
      setupLoaded({}, { darkMode: false });
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('toggle has correct aria-checked in dark mode', () => {
      setupLoaded({}, { darkMode: true });
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('toggle has correct aria-label in light mode', () => {
      setupLoaded({}, { darkMode: false });
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    });

    it('toggle has correct aria-label in dark mode', () => {
      setupLoaded({}, { darkMode: true });
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });

    it('calls setDarkMode(true) when toggling from light mode', async () => {
      const { themeValue } = setupLoaded({}, { darkMode: false });
      await userEvent.click(screen.getByRole('switch'));
      expect(themeValue.setDarkMode).toHaveBeenCalledWith(true);
    });

    it('calls setDarkMode(false) when toggling from dark mode', async () => {
      const { themeValue } = setupLoaded({}, { darkMode: true });
      await userEvent.click(screen.getByRole('switch'));
      expect(themeValue.setDarkMode).toHaveBeenCalledWith(false);
    });
  });

  /* ==================== Change Password ==================== */

  describe('Change Password section', () => {
    it('renders ChangePasswordForm component', () => {
      setupLoaded();
      expect(screen.getByText('Change Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
    });
  });

  /* ==================== Account section ==================== */

  describe('Account section', () => {
    it('renders Account heading', () => {
      setupLoaded();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });

    it('renders member since date when profile has created_at', () => {
      setupLoaded({ created_at: '2024-01-15T10:00:00Z' });
      expect(screen.getByText(/Member since/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('does not render member since when profile has no created_at', () => {
      setupLoaded({ created_at: undefined });
      expect(screen.queryByText(/Member since/)).not.toBeInTheDocument();
    });

    it('renders linked providers when user has identities', () => {
      setupLoaded({}, {
        authOverrides: {
          user: {
            ...mockUser,
            identities: [
              { provider: 'google', id: 'g1', user_id: 'user-123', identity_data: {}, created_at: '', updated_at: '', last_sign_in_at: '' },
            ],
          } as unknown as User,
        },
      });
      expect(screen.getByText(/Signed in with/)).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('renders email provider label correctly', () => {
      setupLoaded({}, {
        authOverrides: {
          user: {
            ...mockUser,
            identities: [
              { provider: 'email', id: 'e1', user_id: 'user-123', identity_data: {}, created_at: '', updated_at: '', last_sign_in_at: '' },
            ],
          } as unknown as User,
        },
      });
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('does not render providers section when identities are empty', () => {
      setupLoaded({}, {
        authOverrides: {
          user: { ...mockUser, identities: [] } as unknown as User,
        },
      });
      expect(screen.queryByText(/Signed in with/)).not.toBeInTheDocument();
    });
  });

  /* ==================== Export data ==================== */

  describe('Export data', () => {
    it('renders export button', () => {
      setupLoaded();
      expect(screen.getByRole('button', { name: /Export Transactions/i })).toBeInTheDocument();
    });

    it('calls generateCSV and downloadFile when transactions exist', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Export Transactions/i }));
      expect(mockGenerateCSV).toHaveBeenCalledWith(mockTransactions);
      expect(mockDownloadFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/expense-tracker-data-\d{4}-\d{2}-\d{2}\.csv/),
        'text/csv',
      );
      expect(mockToast.success).toHaveBeenCalledWith('Exported 2 transactions');
    });

    it('shows error toast when no transactions to export', async () => {
      mockTransactionsRef.current = [];
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Export Transactions/i }));
      expect(mockToast.error).toHaveBeenCalledWith('No transactions to export');
      expect(mockGenerateCSV).not.toHaveBeenCalled();
    });

    it('shows error toast when transactions data is undefined', async () => {
      mockTransactionsRef.current = undefined;
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Export Transactions/i }));
      expect(mockToast.error).toHaveBeenCalledWith('No transactions to export');
    });
  });

  /* ==================== Danger zone / delete account ==================== */

  describe('Danger zone', () => {
    it('renders danger zone heading and delete button', () => {
      setupLoaded();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument();
    });

    it('opens delete confirmation modal on click', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByText(/This will:/)).toBeInTheDocument();
      });
    });

    it('shows warning text in delete modal', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByText('Sign you out of your account')).toBeInTheDocument();
        expect(screen.getByText('Remove your access to this app')).toBeInTheDocument();
      });
    });

    it('Delete Forever is disabled until "DELETE" is typed', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeDisabled();
      });
    });

    it('enables Delete Forever when user types "DELETE"', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
      expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeEnabled();
    });

    it('keeps Delete Forever disabled for partial match', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('DELETE'), 'DELET');
      expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeDisabled();
    });

    it('keeps Delete Forever disabled for lowercase "delete"', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('DELETE'), 'delete');
      expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeDisabled();
    });

    it('calls signOut and shows toast when Delete Forever is clicked', async () => {
      const { authValue } = setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
      await userEvent.click(screen.getByRole('button', { name: 'Delete Forever' }));
      await waitFor(() => {
        expect(authValue.signOut).toHaveBeenCalled();
      });
      expect(mockToast.success).toHaveBeenCalledWith('Account signed out and removed');
    });

    it('closes modal and resets text when Cancel is clicked', async () => {
      setupLoaded();
      await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
      await waitFor(() => {
        expect(screen.getByText(/This will:/)).toBeInTheDocument();
      });
      await userEvent.type(screen.getByPlaceholderText('DELETE'), 'DEL');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await waitFor(() => {
        expect(screen.queryByText(/This will:/)).not.toBeInTheDocument();
      });
    });
  });

  /* ==================== Edge cases ==================== */

  describe('Edge cases', () => {
    it('renders gracefully when profile full_name is null', () => {
      setupLoaded({ full_name: null });
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toHaveValue('');
    });

    it('handles profile with no avatar_url', () => {
      setupLoaded({ avatar_url: null });
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('handles rapid clicks on export button', async () => {
      setupLoaded();
      const btn = screen.getByRole('button', { name: /Export Transactions/i });
      await userEvent.click(btn);
      await userEvent.click(btn);
      await userEvent.click(btn);
      expect(mockGenerateCSV).toHaveBeenCalledTimes(3);
    });

    it('handles multiple providers in identities', () => {
      setupLoaded({}, {
        authOverrides: {
          user: {
            ...mockUser,
            identities: [
              { provider: 'email', id: 'e1', user_id: 'user-123', identity_data: {}, created_at: '', updated_at: '', last_sign_in_at: '' },
              { provider: 'google', id: 'g1', user_id: 'user-123', identity_data: {}, created_at: '', updated_at: '', last_sign_in_at: '' },
            ],
          } as unknown as User,
        },
      });
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
    });

    it('renders unknown provider name as-is', () => {
      setupLoaded({}, {
        authOverrides: {
          user: {
            ...mockUser,
            identities: [
              { provider: 'github', id: 'gh1', user_id: 'user-123', identity_data: {}, created_at: '', updated_at: '', last_sign_in_at: '' },
            ],
          } as unknown as User,
        },
      });
      expect(screen.getByText('github')).toBeInTheDocument();
    });
  });
});
