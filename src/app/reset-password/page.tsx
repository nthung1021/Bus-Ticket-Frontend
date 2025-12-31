"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast, { Toaster } from 'react-hot-toast';
import { useVerifyResetToken, useResetPassword } from 'src/hooks/useAuth';

type FormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const { mutateAsync: verify } = useVerifyResetToken();
  const { mutateAsync: reset } = useResetPassword();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      setIsVerifying(true);
      try {
        const res: any = await verify({ token });
        setUserId(res.data?.userId || null);
        setIsTokenValid(true);
      } catch (err: any) {
        setIsTokenValid(false);
        toast.error(err?.response?.data?.message || err?.message || 'Invalid or expired token');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, verify]);

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const t = toast.loading('Resetting password...');
    setIsResetting(true);
    try {
      await reset({ token, newPassword: data.password });
      toast.success('Password updated successfully', { id: t });
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password', { id: t });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-10 px-4 sm:px-6 lg:px-8">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { background: '#363636', color: '#fff' },
        }}
      />

      <div className="max-w-md w-full space-y-6 bg-card p-6 rounded-lg shadow-md border border-border">
        <div className="text-center">
          <h2 className="mt-4 text-h2 text-foreground">Reset your password</h2>
        </div>

        {isTokenValid === null && (
          <div className="text-center">{isVerifying ? 'Verifying token...' : 'Verifying...'}</div>
        )}

        {isTokenValid === false && (
          <div className="text-center text-destructive">Invalid or expired reset token.</div>
        )}

        {isTokenValid === true && (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">New password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-destructive' : 'border-input'} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                placeholder="••••••••"
                {...register('password', { required: 'Please enter a new password', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
              />
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-destructive' : 'border-input'} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                placeholder="••••••••"
                {...register('confirmPassword', { required: 'Please confirm your new password' })}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <button
                type="submit"
                disabled={isResetting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? 'Saving...' : 'Set new password'}
              </button>
            </div>
          </form>
        )}

        <div className="text-sm text-muted-foreground">
          If you didn't request this, you can ignore this message or contact support.
        </div>
      </div>
    </div>
  );
}
