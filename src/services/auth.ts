import api from "@/lib/api";
import { LoginRequest, LoginResponse } from "@/types/auth";

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  getCurrentUser: () => {
    // This is a placeholder. In a real app, you might want to decode the JWT token
    // or make an API call to get the current user's data
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    // This is a simple way to get user info from the token
    // In a real app, you might want to use a JWT library to decode the token
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("accessToken");
  },
};
