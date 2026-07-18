import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormAlert from '@/components/ui/FormAlert';
import { cn } from '@/utils/cn';
import { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

function getPasswordStrength(password: string): { level: PasswordStrength; score: number } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', score: 25 };
  if (score <= 2) return { level: 'fair', score: 50 };
  if (score <= 3) return { level: 'good', score: 75 };
  return { level: 'strong', score: 100 };
}

const strengthConfig: Record<PasswordStrength, { color: string; bg: string; text: string }> = {
  weak: { color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-600' },
  fair: { color: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-600' },
  good: { color: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-600' },
  strong: { color: 'bg-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-600' },
};

export default function ChangePasswordForm() {
  const { updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const passwordValue = watch('password') ?? '';
  const strength = passwordValue.length > 0 ? getPasswordStrength(passwordValue) : null;

  async function onSubmit(data: PasswordFormData) {
    setLoading(true);
    const { error } = await updatePassword(data.password);
    if (error) {
      setError('root', { message: error.message });
    } else {
      reset();
      toast.success('Password updated successfully');
    }
    setLoading(false);
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Lock size={16} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <FormAlert message={errors.root.message} />
        )}

        <div className="space-y-2">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Password strength indicator */}
          {strength && (
            <div className="space-y-1">
              <div className={cn('h-1.5 w-full rounded-full', strengthConfig[strength.level].bg)}>
                <div
                  className={cn('h-full rounded-full transition-all duration-300', strengthConfig[strength.level].color)}
                  style={{ width: `${String(strength.score)}%` }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className={strengthConfig[strength.level].text} />
                <span className={cn('text-[11px] font-medium capitalize', strengthConfig[strength.level].text)}>
                  {strength.level}
                </span>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={loading}>
          Update Password
        </Button>
      </form>
    </Card>
  );
}

