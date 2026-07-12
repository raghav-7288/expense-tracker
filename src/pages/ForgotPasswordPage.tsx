import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  async function onSubmit(data: ForgotFormData) {
    setLoading(true);
    const { error } = await resetPassword(data.email);
    if (error) {
      setError('root', { message: error.message });
    } else {
      setSent(true);
      toast.success('Password reset link sent!');
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-500 mb-6">
          We&apos;ve sent a password reset link to your email address.
        </p>
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700 text-sm">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Forgot password?</h2>
      <p className="text-sm text-gray-500 mb-6">Enter your email and we&apos;ll send a reset link</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && (
          <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600">
            {errors.root.message}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="[REDACTED_EMAIL_ADDRESS_1]"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" loading={loading} className="w-full">
          Send Reset Link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

