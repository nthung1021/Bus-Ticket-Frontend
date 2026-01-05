"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { authService } from "@/services/auth";

/**
 * Kiểu dữ liệu cho form đăng ký (react-hook-form)
 * - name: Họ và tên đầy đủ người dùng
 * - email: Địa chỉ email
 * - phone: Số điện thoại (định dạng VN)
 * - password: Mật khẩu
 * - confirmPassword: Xác nhận mật khẩu
 */
type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

/**
 * Component client-side cho trang đăng ký (Sign Up)
 * - Sử dụng react-hook-form để quản lý validation và state form
 * - Gọi `authService.register` để tạo tài khoản
 * - Hiển thị Toaster thông báo thành công/lỗi
 */
export default function SignUpClient() {
  // next/navigation hook để navigate (client-side routing)
  const router = useRouter();

  // Trạng thái loading để disable button khi đang gửi request
  const [isLoading, setIsLoading] = useState(false);

  // Khai báo và cấu hình react-hook-form
  // - `mode: 'onBlur'` => validation chạy khi field bị blur (mất focus)
  const {
    register,
    handleSubmit,
    formState: { errors }, // chứa lỗi validation cho từng field
    watch, // dùng để so sánh giá trị confirmPassword với password
    setError, // để set lỗi chung (root) khi nhận lỗi từ server
  } = useForm<FormData>({
    mode: "onBlur",
  });

  /**
   * Xử lý submit form
   * - Hiển thị toast loading
   * - Gọi API đăng ký
   * - Nếu thành công: hiển thị success toast và chuyển hướng sang trang xác thực email
   * - Nếu lỗi: đọc message từ response (nếu có), hiển thị toast lỗi và set lỗi root để render message trên form
   */
  const onSubmit = async (data: FormData) => {
    // Bật trạng thái loading để disable nút
    setIsLoading(true);

    // Hiển thị toast loading (sẽ được thay thế bằng success/error sau)
    const loadingToast = toast.loading("Creating account...");

    try {
      // Gọi API đăng ký với payload mapping đúng tên trường backend
      await authService.register({
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      // Nếu không ném lỗi: đăng ký thành công
      // Thay toast loading bằng success message (dùng cùng id để replace)
      toast.success("Registration successful! A verification code was sent to your email.", {
        id: loadingToast,
      });

      // Delay ngắn để người dùng thấy toast rồi redirect (cảm nhận UX tốt hơn)
      setTimeout(() => {
        // Đưa email vào query để prefill trang verify nếu cần
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      }, 1500);
    } catch (error: any) {
      // Log lên console để dev dễ debug
      console.error("Registration error:", error);

      // Thử lấy message từ response của Axios (nếu backend trả về dạng { message })
      // Nếu không có, fallback sang error.message hoặc thông báo mặc định
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred during registration";

      // Thay toast loading bằng error message
      toast.error(errorMessage, { id: loadingToast });

      // Set lỗi chung trên form (field `root`) để hiển thị ở top của form
      setError("root", {
        type: "manual",
        message: errorMessage,
      });
    } finally {
      // Dù thành công hay thất bại, tắt loading
      setIsLoading(false);
    }
  };

  return (
    <>
      {/*
        Toaster: cấu hình global cho react-hot-toast
        - position: vị trí hiển thị toast
        - duration + style: tuỳ chỉnh thời gian và style cho toast
      */}
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

      {/*
        Layout chính của form
        - Container center page
        - Card chứa form với shadow, border
      */}
      <div className="min-h-screen flex items-center justify-center bg-background py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-card p-6 rounded-lg shadow-md border border-border">
          <div className="text-center">
            <h2 className="mt-4 text-h2 text-foreground">Create an account</h2>
            <p className="mt-2 text-caption text-muted-foreground">
              Already have an account?{" "}
              {/* Link đến trang sign in */}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>

          {/*
            Nếu có lỗi chung (ví dụ lỗi server hoặc email đã tồn tại),
            nó sẽ được set vào `errors.root` và hiển thị ở đây
          */}
          {errors.root && (
            <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-4">
              <div className="flex">
                <div className="shrink-0">
                  {/* Icon cảnh báo */}
                  <svg className="h-5 w-5 text-destructive" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">{errors.root.message}</p>
                </div>
              </div>
            </div>
          )}

          {/*
            Form chính
            - `handleSubmit(onSubmit)` là wrapper của react-hook-form để validate trước khi gọi onSubmit
          */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-caption font-medium text-foreground">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.name ? "border-destructive" : "border-input"} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="Full name"
                  {...register("name", {
                    // Bắt buộc, min 2, max 100 ký tự
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
                {/* Hiển thị lỗi field name */}
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.email ? "border-destructive" : "border-input"} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="you@example.com"
                  {...register("email", {
                    // Bắt buộc, regex kiểm tra format email cơ bản
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.phone ? "border-destructive" : "border-input"} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="1234567890"
                  {...register("phone", {
                    // Bắt buộc, dùng regex kiểm tra số điện thoại VN (0... hoặc +84...)
                    required: "Phone number is required",
                    pattern: {
                      value: /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9\d)\d{7}$/,
                      message: "Please enter a valid Vietnamese phone number (e.g., 0912345678 or +84912345678)",
                    },
                  })}
                />
                {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.password ? "border-destructive" : "border-input"} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="••••••••"
                  {...register("password", {
                    // Bắt buộc, tối thiểu 8 ký tự và phải có uppercase, lowercase, số và ký tự đặc biệt
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message: "Must include uppercase, lowercase, number, and special character",
                    },
                  })}
                />
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? "border-destructive" : "border-input"} rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm text-foreground bg-background`}
                  placeholder="••••••••"
                  {...register("confirmPassword", {
                    // Bắt buộc và phải khớp với giá trị của field `password`
                    required: "Please confirm your password",
                    validate: (value: string) => value === watch("password") || "Passwords do not match",
                  })}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Submit button
                - Disabled khi isLoading = true
                - Hiển thị spinner và text "Creating Account..." khi loading
            */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    {/* Spinner svg */}
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
