import api from "@/lib/api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: any;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", credentials);
    return response.data.data;
  },

  logout: async () => {
    // Call logout endpoint to clear cookies on server
    await api.post("/auth/logout");
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
