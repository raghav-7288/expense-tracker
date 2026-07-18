import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormAlert from '@/components/ui/FormAlert';
import AnimatedPage from '@/components/ui/AnimatedPage';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  async function onSubmit(data: ResetFormData) {
    setLoading(true);
    const { error } = await updatePassword(data.password);
    if (error) {
      setError('root', { message: error.message });
      toast.error('Failed to update password');
    } else {
      toast.success('Password updated successfully!');
      navigate('/dashboard');
    }
    setLoading(false);
  }

  return (
    <AnimatedPage>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Set new password</h2>
        <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <FormAlert message={errors.root.message} />}

        <Input
          label="New Password"
          type="password"
          placeholder="Enter new password"
          autoComplete="new-password"
          leftIcon={<Lock size={15} />}
          helperText="At least 6 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          leftIcon={<Lock size={15} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="pt-1">
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Update Password
          </Button>
        </div>
      </form>
    </AnimatedPage>
  );
}
