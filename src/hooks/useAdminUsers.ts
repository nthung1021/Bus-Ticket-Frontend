import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "src/lib/api";

export type AdminUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

export function useAdminUsers() {
  return useQuery<AdminUser[], Error>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      return res.data as AdminUser[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

type ChangeRoleVars = { userId: string; role: string };
type ChangeRoleContext = { previous?: AdminUser[] };

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation<
    AdminUser, // TData
    Error, // TError
    ChangeRoleVars, // TVariables
    ChangeRoleContext // TContext
  >({
    mutationFn: async ({ userId, role }: ChangeRoleVars) => {
      const res = await api.patch(`/admin/users/${userId}/role`, { role });
      return res.data as AdminUser;
    },
    // optimistic update: update the cached list immediately
    onMutate: async ({ userId, role }) => {
      await qc.cancelQueries({ queryKey: ["admin", "users"] });
      const previous = qc.getQueryData<AdminUser[]>(["admin", "users"]);
      qc.setQueryData<AdminUser[] | undefined>(["admin", "users"], (old) =>
        old?.map((u) => (u.userId === userId ? { ...u, role } : u)),
      );
      return { previous };
    },
    onError: (
      _err: Error,
      _vars: ChangeRoleVars,
      context?: ChangeRoleContext,
    ) => {
      if (context?.previous) {
        qc.setQueryData(["admin", "users"], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
