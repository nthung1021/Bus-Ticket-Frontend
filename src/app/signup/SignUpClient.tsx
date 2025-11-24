"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { authService } from "@/services/auth";

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export default function SignUpClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<FormData>({
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const loadingToast = toast.loading("Creating account...");

    try {
      await authService.register({
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      // Show success message
      toast.success("Registration successful! Redirecting...", {
        id: loadingToast,
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: any) {
      console.error("Registration error:", error);

      // Extract error message from Axios error response
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred during registration";

      toast.error(errorMessage, { id: loadingToast });
      setError("root", {
        type: "manual",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <div className="min-h-screen flex items-center justify-center bg-background py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="text-center">
            <h2 className="mt-4 text-h2 text-foreground">Create an account</h2>
            <p className="mt-2 text-caption text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary/80"
              >
                Sign in
              </Link>
            </p>
          </div>

          {errors.root && (
            <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-destructive"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">
                    {errors.root.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-caption font-medium text-foreground"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.name ? "border-destructive" : "border-input"
                  } rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="Full name"
                  {...register("name", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Full name must be at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Full name cannot exceed 100 characters",
                    },
                  })}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.email ? "border-destructive" : "border-input"
                  } rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-foreground"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.phone ? "border-destructive" : "border-input"
                  } rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="1234567890"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value:
                        /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)\d{7}$/,
                      message:
                        "Please enter a valid Vietnamese phone number (e.g., 0912345678 or +84912345678)",
                    },
                  })}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.password ? "border-destructive" : "border-input"
                  } rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="••••••••"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message:
                        "Must include uppercase, lowercase, number, and special character",
                    },
                  })}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-foreground"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.confirmPassword
                      ? "border-destructive"
                      : "border-input"
                  } rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="••••••••"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value: string) =>
                      value === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  "Sign up"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
