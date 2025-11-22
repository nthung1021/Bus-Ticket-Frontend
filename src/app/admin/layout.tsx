import ProtectedRoutes from "@/components/ProtectedRoutes";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoutes>{children}</ProtectedRoutes>;
}
