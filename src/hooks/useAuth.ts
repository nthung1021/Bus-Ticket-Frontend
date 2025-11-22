// hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "src/services/auth";
import { useRouter } from "next/navigation";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: any;
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
      router.push("/dashboard");
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
      queryClient.clear();
      router.push("/login");
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
