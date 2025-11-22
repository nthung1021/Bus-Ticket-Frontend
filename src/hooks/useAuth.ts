// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "src/services/auth";
import { useRouter } from "next/navigation";

export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      let payload = response?.data ?? response;
      if (!payload) return;
      if (payload?.success && payload.data) payload = payload.data;
      localStorage.setItem("accessToken", payload.accessToken);
      localStorage.setItem("refreshToken", payload.refreshToken);
      queryClient.setQueryData(["currentUser"], payload.user);
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
      router.push("/login");
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: authService.getCurrentUser,
    enabled: !!localStorage.getItem("accessToken"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
