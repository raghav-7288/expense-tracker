import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import ProfilePage from '@/pages/ProfilePage';

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
  useUpdateProfile: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}));

vi.mock('@/hooks/useTransactions', () => ({
  useTransactions: () => ({ data: [
    { id: '1', type: 'expense', amount: 50, description: 'Test', date: '2024-06-15', user_id: 'u1', category_id: null, notes: null, created_at: '', updated_at: '', categories: null },
  ] }),
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { rpc: vi.fn().mockResolvedValue({ error: null }) },
}));

import { useProfile } from '@/hooks/useProfile';
const mockUseProfile = vi.mocked(useProfile);

const defaultProfile = {
  id: 'u1', email: '[REDACTED_EMAIL_ADDRESS_1]', full_name: 'Test User', currency: 'USD',
  avatar_url: null, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-06-15T10:00:00Z',
};

describe('ProfilePage', () => {
  it('shows skeleton when loading', () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true } as never);
    const { container } = renderWithProviders(<ProfilePage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders profile form with user data', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toHaveValue('Test User');
  });

  it('renders appearance section with dark mode toggle', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('renders change password section', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });

  it('renders currency selector with options', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
  });

  it('displays user initial in avatar', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders user name and email in header', () => {
    mockUseProfile.mockReturnValue({ data: { ...defaultProfile, full_name: 'John Doe' }, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders dark mode toggle with correct label in light mode', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />, { darkMode: false });
    expect(screen.getByText('Light theme is active')).toBeInTheDocument();
  });

  it('renders dark mode toggle with correct label in dark mode', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />, { darkMode: true });
    expect(screen.getByText('Dark theme is active')).toBeInTheDocument();
  });

  it('disables Save Changes button when form is not dirty', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    const saveBtn = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveBtn).toBeDisabled();
  });

  it('renders member since date', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
  });

  it('renders account section with export button', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Transactions/i })).toBeInTheDocument();
  });

  it('renders danger zone with delete account button', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete Account/i })).toBeInTheDocument();
  });

  it('opens delete confirmation modal', async () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
    await waitFor(() => {
      expect(screen.getByText(/This will:/)).toBeInTheDocument();
    });
  });

  it('disables Delete Forever button until DELETE is typed', async () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    await userEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeDisabled();
    });
    await userEvent.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
    expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeEnabled();
  });

  it('renders page header using PageHeader component', () => {
    mockUseProfile.mockReturnValue({ data: defaultProfile, isLoading: false } as never);
    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your account settings')).toBeInTheDocument();
  });
});
