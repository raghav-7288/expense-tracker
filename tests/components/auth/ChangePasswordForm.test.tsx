import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('react-hot-toast', () => ({ default: mockToast }));

/* ---------- tests ---------- */

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ==================== Rendering ==================== */

  describe('Rendering', () => {
    it('renders heading with lock icon', () => {
      renderWithProviders(<ChangePasswordForm />);
      expect(screen.getByText('Change Password')).toBeInTheDocument();
    });

    it('renders New Password and Confirm New Password fields', () => {
      renderWithProviders(<ChangePasswordForm />);
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    });

    it('renders Update Password submit button', () => {
      renderWithProviders(<ChangePasswordForm />);
      expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
    });

    it('password fields have type="password"', () => {
      renderWithProviders(<ChangePasswordForm />);
      expect(screen.getByLabelText('New Password')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('Confirm New Password')).toHaveAttribute('type', 'password');
    });

    it('password fields have correct placeholders', () => {
      renderWithProviders(<ChangePasswordForm />);
      const placeholders = screen.getAllByPlaceholderText('••••••••');
      expect(placeholders).toHaveLength(2);
    });

    it('does not show password strength indicator initially', () => {
      renderWithProviders(<ChangePasswordForm />);
      expect(screen.queryByText('weak')).not.toBeInTheDocument();
      expect(screen.queryByText('fair')).not.toBeInTheDocument();
      expect(screen.queryByText('good')).not.toBeInTheDocument();
      expect(screen.queryByText('strong')).not.toBeInTheDocument();
    });

    it('does not show any errors initially', () => {
      renderWithProviders(<ChangePasswordForm />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  /* ==================== Password strength indicator ==================== */

  describe('Password strength indicator', () => {
    it('shows "weak" for very short password', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'abc');
      await waitFor(() => {
        expect(screen.getByText('weak')).toBeInTheDocument();
      });
    });

    it('shows "weak" for a 6-char lowercase-only password', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'abcdef');
      await waitFor(() => {
        expect(screen.getByText('weak')).toBeInTheDocument();
      });
    });

    it('shows "fair" for a longer password with uppercase', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'Abcdefgh');
      await waitFor(() => {
        expect(screen.getByText('fair')).toBeInTheDocument();
      });
    });

    it('shows "good" for a password with uppercase and number', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'Abcdefg1');
      await waitFor(() => {
        expect(screen.getByText('good')).toBeInTheDocument();
      });
    });

    it('shows "strong" for a complex password', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'MyStr0ng!Pass');
      await waitFor(() => {
        expect(screen.getByText('strong')).toBeInTheDocument();
      });
    });

    it('hides strength indicator when password is cleared', async () => {
      renderWithProviders(<ChangePasswordForm />);
      const input = screen.getByLabelText('New Password');
      await userEvent.type(input, 'abc');
      await waitFor(() => {
        expect(screen.getByText('weak')).toBeInTheDocument();
      });
      await userEvent.clear(input);
      await waitFor(() => {
        expect(screen.queryByText('weak')).not.toBeInTheDocument();
      });
    });
  });

  /* ==================== Validation ==================== */

  describe('Validation', () => {
    it('shows error for password shorter than 6 characters', async () => {
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

    it('does not submit when both fields are empty', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
      expect(authValue.updatePassword).not.toHaveBeenCalled();
    });

    it('validates password length (exactly 6 characters passes)', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'abcdef');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'abcdef');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(authValue.updatePassword).toHaveBeenCalledWith('abcdef');
      });
    });
  });

  /* ==================== Successful submission ==================== */

  describe('Successful password update', () => {
    it('calls updatePassword with correct value', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(authValue.updatePassword).toHaveBeenCalledWith('newpass123');
      });
    });

    it('shows success toast after successful update', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Password updated successfully');
      });
    });

    it('resets form fields after successful update', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalled();
      });
      expect(screen.getByLabelText('New Password')).toHaveValue('');
      expect(screen.getByLabelText('Confirm New Password')).toHaveValue('');
    });

    it('hides password strength indicator after form reset', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await waitFor(() => {
        expect(screen.getByText('good')).toBeInTheDocument();
      });
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(screen.queryByText('good')).not.toBeInTheDocument();
      });
    });
  });

  /* ==================== Failed submission ==================== */

  describe('Failed password update', () => {
    it('displays server error in FormAlert when update fails', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      (authValue.updatePassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: new Error('Auth session expired'),
      });
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(screen.getByText('Auth session expired')).toBeInTheDocument();
      });
    });

    it('does not show success toast when update fails', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      (authValue.updatePassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: new Error('Network error'),
      });
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('does not reset form fields when update fails', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      (authValue.updatePassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: new Error('Failed'),
      });
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
      // Fields should retain their values
      expect(screen.getByLabelText('New Password')).toHaveValue('newpass123');
      expect(screen.getByLabelText('Confirm New Password')).toHaveValue('newpass123');
    });

    it('error alert has role="alert" for accessibility', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      (authValue.updatePassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        error: new Error('Something went wrong'),
      });
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        const errorAlert = alerts.find(a => a.textContent?.includes('Something went wrong'));
        expect(errorAlert).toBeInTheDocument();
      });
    });
  });

  /* ==================== Edge cases ==================== */

  describe('Edge cases', () => {
    it('handles password with only special characters (but long enough)', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), '!@#$%^');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), '!@#$%^');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(authValue.updatePassword).toHaveBeenCalledWith('!@#$%^');
      });
    });

    it('handles password exactly at minimum length boundary', async () => {
      renderWithProviders(<ChangePasswordForm />);
      await userEvent.type(screen.getByLabelText('New Password'), '12345');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), '12345');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('form can be resubmitted after a failed attempt', async () => {
      const { authValue } = renderWithProviders(<ChangePasswordForm />);
      const updatePwMock = authValue.updatePassword as ReturnType<typeof vi.fn>;

      // First attempt: fail
      updatePwMock.mockResolvedValueOnce({ error: new Error('Temporary error') });
      await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
      await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(screen.getByText('Temporary error')).toBeInTheDocument();
      });

      // Second attempt: succeed
      updatePwMock.mockResolvedValueOnce({ error: null });
      await userEvent.click(screen.getByRole('button', { name: 'Update Password' }));
      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Password updated successfully');
      });
    });
  });
});
