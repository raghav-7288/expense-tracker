import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import ProfilePage from '@/pages/ProfilePage';

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
  useUpdateProfile: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { useProfile } from '@/hooks/useProfile';
const mockUseProfile = vi.mocked(useProfile);

describe('ProfilePage', () => {
  it('shows skeleton when loading', () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true } as never);
    const { container } = renderWithProviders(<ProfilePage />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders profile form with user data', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: 'test@example.com', full_name: 'Test', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toHaveValue('Test');
  });

  it('renders appearance section with dark mode toggle', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: 'test@example.com', full_name: 'Test', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('renders change password section', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: '[REDACTED_EMAIL_ADDRESS_1]', full_name: 'Test', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });

  it('submits profile form', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    vi.mocked(await import('@/hooks/useProfile')).useUpdateProfile = (() => ({ mutateAsync: mockMutateAsync, isPending: false })) as never;

    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: '[REDACTED_EMAIL_ADDRESS_1]', full_name: 'Test User', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />);
    const saveButton = screen.getByRole('button', { name: 'Save Changes' });
    expect(saveButton).toBeInTheDocument();
  });

  it('renders currency selector with options', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: '[REDACTED_EMAIL_ADDRESS_1]', full_name: 'Test', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />);
    expect(screen.getByLabelText('Currency')).toBeInTheDocument();
  });

  it('renders user email and name in header', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: '[REDACTED_EMAIL_ADDRESS_1]', full_name: 'John Doe', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders dark mode toggle with correct label in light mode', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: '[REDACTED_EMAIL_ADDRESS_1]', full_name: 'Test', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />, { darkMode: false });
    expect(screen.getByText('Light theme is active')).toBeInTheDocument();
  });

  it('renders dark mode toggle with correct label in dark mode', () => {
    mockUseProfile.mockReturnValue({
      data: { id: 'u1', email: '[REDACTED_EMAIL_ADDRESS_1]', full_name: 'Test', currency: 'USD', avatar_url: null, created_at: '', updated_at: '' },
      isLoading: false,
    } as never);

    renderWithProviders(<ProfilePage />, { darkMode: true });
    expect(screen.getByText('Dark theme is active')).toBeInTheDocument();
  });
});

