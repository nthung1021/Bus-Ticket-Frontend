"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { authService } from '@/services/auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      toast.error('Please provide both email and verification code');
      return;
    }
    setIsLoading(true);
    const t = toast.loading('Verifying...');
    try {
      await authService.verifyEmail({ email, code });
      toast.success('Email verified successfully! Redirecting...', { id: t });
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Verification failed';
      toast.error(msg, { id: t });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email to resend the verification code');
      return;
    }
    setIsResending(true);
    const t = toast.loading('Resending verification email...');
    try {
      await authService.resendVerification({ email });
      toast.success('Verification email resent', { id: t });
      setResendCooldown(30); // 30 seconds cooldown
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Resend failed';
      toast.error(msg, { id: t });
    } finally {
      setIsResending(false);
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
          <h2 className="mt-4 text-h2 text-foreground">Verify your email</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Enter the 6-digit code sent to your email.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleVerify}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-foreground">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background"
              placeholder="123456"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify email'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="ml-3 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
            </button>
          </div>
        </form>

        <div className="text-sm text-muted-foreground">
          Didn't receive the email? Use "Resend code". If the problem persists, check your spam folder or contact support.
        </div>
      </div>
    </div>
  );
}
