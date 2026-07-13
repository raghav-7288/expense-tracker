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
import Divider from '@/components/ui/Divider';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import toast from 'react-hot-toast';
import { User, Mail, Lock } from 'lucide-react';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  async function onSubmit(data: SignUpFormData) {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    if (error) {
      setError('root', { message: error.message });
    } else {
      toast.success('Account created! Check your email to confirm.');
    }
    setLoading(false);
  }

  return (
    <AnimatedPage>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Create an account</h2>
        <p className="text-sm text-gray-500 mt-1">Start tracking your finances in seconds</p>
      </div>

      <GoogleSignInButton onClick={signInWithGoogle} />

      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errors.root && <FormAlert message={errors.root.message} />}

        <Input
          label="Full Name"
          placeholder="John Doe"
          autoComplete="name"
          leftIcon={<User size={15} />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          leftIcon={<Lock size={15} />}
          helperText="At least 6 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          leftIcon={<Lock size={15} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="pt-1">
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create Account
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </AnimatedPage>
  );
}
