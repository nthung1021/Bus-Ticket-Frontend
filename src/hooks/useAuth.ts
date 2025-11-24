// hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "src/services/auth";
import { useRouter } from "next/navigation";

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

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Tokens are now stored in HTTP-only cookies by the server
      // We only need to store user data
      queryClient.setQueryData(["currentUser"], data.user);
      router.push("/");
    },
  });
};

export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Cookies are cleared by the server
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } catch (e) {
        console.error("Failed to clear localStorage on logout:", e);
      }

      try {
        queryClient.clear();
      } catch (e) {
        console.error("Failed to clear queryClient cache on logout:", e);
      }

      router.push("/");
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
