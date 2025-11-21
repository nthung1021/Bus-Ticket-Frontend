'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from 'components/AuthContext';
import { useCurrentUser } from '@/hooks/useAuth'; // optional if you use query for user

export default function ProtectedRole({ children, allowed }: { children: ReactNode; allowed: string[] }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
      return;
    }
    if (!allowed.map(r => r.toLowerCase()).includes((user?.role ?? '').toString().toLowerCase())) {
      alert('You do not have permission to access this page.');
      router.push('/');
    }
  }, [user, router, allowed]);

  if (!user) return null;

  return <>{children}</>;
}
