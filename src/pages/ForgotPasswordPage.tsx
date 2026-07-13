import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormAlert from '@/components/ui/FormAlert';
import AnimatedPage from '@/components/ui/AnimatedPage';
import toast from 'react-hot-toast';
import { Mail, CheckCircle2 } from 'lucide-react';

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
      <AnimatedPage className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} className="text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
          We&apos;ve sent a password reset link to your email address. It may take a minute to arrive.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-700"
        >
          ← Back to sign in
        </Link>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Forgot password?</h2>
        <p className="text-sm text-gray-500 mt-1">No worries, we&apos;ll send you reset instructions</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <FormAlert message={errors.root.message} />}

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email address"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="pt-1">
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Send Reset Link
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          ← Back to sign in
        </Link>
      </p>
    </AnimatedPage>
  );
}
