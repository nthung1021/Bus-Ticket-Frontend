import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error status is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if this is an auth endpoint (login, register, refresh-token)
      const isAuthEndpoint =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/refresh-token");

      // If it's an auth endpoint, don't try to refresh or redirect
      // Just return the error so the form can display it
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Try to refresh the token (cookies will be sent automatically)
        await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          {
            withCredentials: true, // Send cookies with refresh request
          },
        );

        // Retry the original request (new cookies are now set)
        return api(originalRequest);
      } catch (refreshError) {
        // console.error("Token refresh failed:", refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
