import api from "@/lib/api";

interface User {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface RegisterResponse {
  userId: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  createdAt: string;
}

interface SendOtpRequest {
  phone: string;
}

interface SendOtpResponse {
  success: boolean;
  message: string;
  data: {
    phone: string;
    expiresAt: string;
    otp?: string; // DEV mode only
  };
}

interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      userId: string;
      phone: string;
      fullName: string;
      email?: string;
      role: string;
    };
  };
}

export const authService = {
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data.data;
  },

  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", credentials);
    return response.data.data;
  },

  logout: async () => {
    // Call logout endpoint to clear cookies on server
    await api.post("/auth/logout");
  },

  // Phone/OTP Authentication - DEV/DEMO Mode
  sendOtp: async (data: SendOtpRequest): Promise<SendOtpResponse> => {
    const response = await api.post("/auth/phone/send-otp", data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const response = await api.post("/auth/phone/verify-otp", data);
    return response.data;
  },

  verifyEmail: async (data: { email: string; code: string }) => {
    const response = await api.post("/auth/verify-email", data);
    return response.data;
  },

  resendVerification: async (data: { email: string }) => {
    const response = await api.post("/auth/resend-verification", data);
    return response.data;
  },

  // Request a password reset email. Server should send reset instructions to the provided email.
  forgotPassword: async (data: { email: string }) => {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
  },

  getCurrentUser: async () => {
    try {
      // Try to fetch current user from backend
      // The access token cookie will be sent automatically
      const response = await api.get("/auth/me");
      return response.data.data;
    } catch (error) {
      // If request fails (e.g., no valid token), return null
      return null;
    }
  },

  refreshToken: async () => {
    // Refresh token is sent automatically via cookie
    const response = await api.post("/auth/refresh-token", {});
    return response.data.data;
  },
};
