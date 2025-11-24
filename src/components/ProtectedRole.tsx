"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "src/hooks/useAuth";

export default function ProtectedRole({
  children,
  allowed,
}: {
  children: ReactNode;
  allowed: string[];
}) {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (
      !allowed
        .map((r) => r.toLowerCase())
        .includes((user?.role ?? "").toString().toLowerCase())
    ) {
      alert("You do not have permission to access this page.");
      router.push("/");
    }
  }, [user, router, allowed, isLoading]);

  if (isLoading) return null;
  if (!user) return null;

  return <>{children}</>;
}
