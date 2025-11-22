import ProtectedRoutes from "@/components/ProtectedRoutes";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoutes>{children}</ProtectedRoutes>;
}
