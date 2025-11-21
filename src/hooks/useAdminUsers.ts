import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'src/lib/api';

export type AdminUser = {
  userId: string;
  name: string;
  email: string;
  role: string;
};

export function useAdminUsers() {
  return useQuery<AdminUser[], Error>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation<
    AdminUser, // return
    any,       // error
    { userId: string; role: string } // variables
  >({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.patch(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    // optimistic update: update the cached list immediately
    onMutate: async ({ userId, role }) => {
        await qc.cancelQueries({ queryKey: ['admin', 'users'] });
        const previous = qc.getQueryData<AdminUser[]>(['admin', 'users']);
        qc.setQueryData<AdminUser[] | undefined>(['admin', 'users'], old =>
          old?.map(u => (u.userId === userId ? { ...u, role } : u))
        );
        return { previous };
      },
      onError: (_err, _vars, context: any) => {
        if (context?.previous) qc.setQueryData(['admin', 'users'], context.previous);
      },
      onSettled: () => {
        qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      },
  })};
