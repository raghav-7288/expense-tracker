import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { CURRENCIES } from '@/utils/constants';
import { User, Moon, Sun } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
  currency: z.string().min(1, 'Currency is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { user, updatePassword } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const updateProfileMutation = useUpdateProfile();
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    setError: setPasswordError,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (profile) {
      resetProfile({
        full_name: profile.full_name ?? '',
        currency: profile.currency,
      });
    }
  }, [profile, resetProfile]);

  async function onProfileSubmit(data: ProfileFormData) {
    await updateProfileMutation.mutateAsync({
      full_name: data.full_name,
      currency: data.currency,
    });
  }

  async function onPasswordSubmit(data: PasswordFormData) {
    setPasswordLoading(true);
    const { error } = await updatePassword(data.password);
    if (error) {
      setPasswordError('root', { message: error.message });
    } else {
      resetPassword();
    }
    setPasswordLoading(false);
  }

  if (isLoading) return <Spinner size={32} />;

  const currencyOptions = CURRENCIES.map((c) => ({ value: c.value, label: c.label }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={28} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile?.full_name || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            error={profileErrors.full_name?.message}
            {...registerProfile('full_name')}
          />

          <Select
            label="Currency"
            options={currencyOptions}
            error={profileErrors.currency?.message}
            {...registerProfile('currency')}
          />

          <Button type="submit" loading={updateProfileMutation.isPending}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Appearance */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4 section-heading">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={20} className="text-gray-500" /> : <Sun size={20} className="text-gray-500" />}
            <div>
              <p className="text-sm font-medium text-gray-900 section-heading">Dark Mode</p>
              <p className="text-xs text-gray-500 muted-text">
                {darkMode ? 'Dark theme is active' : 'Light theme is active'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`toggle-switch ${darkMode ? 'active' : ''}`}
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            role="switch"
            aria-checked={darkMode}
          />
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          {passwordErrors.root && (
            <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600">
              {passwordErrors.root.message}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={passwordErrors.password?.message}
            {...registerPassword('password')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword')}
          />

          <Button type="submit" loading={passwordLoading}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}

