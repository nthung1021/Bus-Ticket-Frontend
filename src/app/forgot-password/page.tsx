"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useForgotPassword } from "src/hooks/useAuth";

type FormData = {
  email: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { register, handleSubmit,   formState: { errors } } = useForm<FormData>();
  const { mutateAsync: forgotMu, status } = useForgotPassword();

  const onSubmit = async (data: FormData) => {
    const t = toast.loading("Sending reset instructions...");
    try {
      await forgotMu(data);
      toast.success(
        "If an account with that email exists, we've sent password reset instructions.",
        { id: t }
      );
      setTimeout(() => router.push('/login'), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Request failed";
      toast.error(msg, { id: t });
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
          <h2 className="mt-4 text-h2 text-foreground">Forgot your password?</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Enter your email and we'll send instructions to reset your password.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-destructive' : 'border-input'} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
              placeholder="you@example.com"
              {...register('email', {
                required: 'Please enter your email',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
              })}
            />
            {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <button
              type="submit"
              disabled={status === 'pending'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'pending' ? 'Sending...' : 'Send reset instructions'}
            </button>
          </div>
        </form>

        <div className="text-sm text-muted-foreground">
          If you don't receive an email, check your spam folder or contact support.
        </div>
      </div>
    </div>
  );
}
