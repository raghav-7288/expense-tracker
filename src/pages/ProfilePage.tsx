import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import AnimatedPage from '@/components/ui/AnimatedPage';
import PageHeader from '@/components/ui/PageHeader';
import { SkeletonProfile } from '@/components/ui/Skeleton';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { cn } from '@/utils/cn';
import { CURRENCIES } from '@/utils/constants';
import { formatDate } from '@/utils/formatDate';
import { generateCSV, downloadFile } from '@/engines/analytics';
import { Moon, Sun, Download, Trash2, AlertTriangle, Shield, Calendar, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
  currency: z.string().min(1, 'Currency is required'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { user, signOut } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const updateProfileMutation = useUpdateProfile();
  const { data: transactions } = useTransactions();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      resetProfile({
        full_name: profile.full_name ?? '',
        currency: profile.currency,
      });
    }
  }, [profile, resetProfile]);

  // Unsaved changes warning
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  async function onProfileSubmit(data: ProfileFormData) {
    await updateProfileMutation.mutateAsync({
      full_name: data.full_name,
      currency: data.currency,
    });
  }

  const handleExportData = useCallback(() => {
    if (!transactions || transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    const csv = generateCSV(transactions);
    const date = new Date().toISOString().split('T')[0] ?? 'export';
    downloadFile(csv, `expense-tracker-data-${date}.csv`, 'text/csv');
    toast.success(`Exported ${String(transactions.length)} transactions`);
  }, [transactions]);

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    // Sign out only — does not delete transactions or other data from the database
    await signOut();
    toast.success('Account signed out and removed');
  }

  if (isLoading) return <SkeletonProfile />;

  const currencyOptions = CURRENCIES.map((c) => ({ value: c.value, label: c.label }));

  const userInitial = (profile?.full_name ?? user?.email ?? 'U').charAt(0).toUpperCase();
  const memberSince = profile?.created_at ? formatDate(profile.created_at.split('T')[0] ?? '') : null;

  // Linked providers
  const identities = user?.identities ?? [];
  const providers = identities.map((i) => i.provider);

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader title="Profile" description="Manage your account settings" />

      {/* Profile Info */}
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-white">{userInitial}</span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{profile?.full_name || 'User'}</p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
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

          <Button type="submit" loading={updateProfileMutation.isPending} disabled={!isDirty}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Appearance */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 section-heading">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon size={18} className="text-gray-400" aria-hidden="true" /> : <Sun size={18} className="text-gray-400" aria-hidden="true" />}
            <div>
              <p className="text-sm font-medium text-gray-900 section-heading">Dark Mode</p>
              <p className="text-xs text-gray-500 muted-text">
                {darkMode ? 'Dark theme is active' : 'Light theme is active'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={cn('toggle-switch', darkMode && 'active')}
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            role="switch"
            aria-checked={darkMode}
          />
        </div>
      </Card>

      {/* Change Password */}
      <ChangePasswordForm />

      {/* Account Info */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 section-heading">Account</h3>
        <div className="space-y-3">
          {/* Member Since */}
          {memberSince && (
            <div className="flex items-center gap-2.5 text-sm text-gray-500">
              <Calendar size={15} className="text-gray-400 flex-shrink-0" />
              <span>Member since {memberSince}</span>
            </div>
          )}

          {/* Linked Providers */}
          {providers.length > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-gray-500">
              <LinkIcon size={15} className="text-gray-400 flex-shrink-0" />
              <span>
                Signed in with{' '}
                {providers.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 text-gray-700 font-medium capitalize">
                    {p === 'google' ? 'Google' : p === 'email' ? 'Email' : p}
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* Export Data */}
          <div className="pt-3 border-t border-gray-100">
            <Button variant="secondary" size="sm" onClick={handleExportData}>
              <Download size={14} />
              Export Transactions (CSV)
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-red-500" />
          <h3 className="text-sm font-semibold text-red-600">Danger Zone</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Remove your account access. All the transactions data will be removed from the database.
        </p>
        <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
          <Trash2 size={14} />
          Delete Account
        </Button>
      </Card>

      {/* Delete Account Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">This will:</p>
              <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                <li>Sign you out of your account</li>
                <li>Remove your access to this app</li>
              </ul>
              <p className="mt-2 text-xs text-gray-500">Your transactions and data will remain in the database.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteLoading}
              disabled={deleteConfirmText !== 'DELETE'}
              onClick={handleDeleteAccount}
              className="flex-1"
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}

