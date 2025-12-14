"use client";

import ProtectedRole from "@/components/ProtectedRole";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAdminUsers,
  useChangeUserRole,
  type AdminUser,
} from "src/hooks/useAdminUsers";
import { useState } from "react";

const ROLES = [
  { key: "customer", label: "Passenger" },
  { key: "admin", label: "Admin" },
  { key: "operator", label: "Operator" },
];

export default function ManageUsersPage() {
  // ProtectedRole wrapper ensures only admin can access
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <AdminPageContent />
    </ProtectedRole>
  );
}

function AdminPageContent() {
  const { data: users, isLoading, isError, error } = useAdminUsers();
  console.log("admin users raw:", users);
  const changeRole = useChangeUserRole();
  const [changingUser, setChangingUser] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex bg-background min-h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <main className="flex-1 pt-20 px-4 pb-4 overflow-auto">
            <div className="text-center py-8">Loading users…</div>
          </main>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex bg-background min-h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <main className="flex-1 pt-20 px-4 pb-4 overflow-auto">
            <div className="text-center py-8 text-destructive">
              Error: {String(error?.message)}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background min-h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <main className="flex-1 pt-20 px-4 pb-4 overflow-auto">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Passenger Management</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[250px]">Email</TableHead>
                      <TableHead className="w-[120px]">Role</TableHead>
                      <TableHead className="w-[200px]">Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <UserRow
                        key={u.userId}
                        user={u}
                        onChangeRole={async (role) => {
                          const confirm = window.confirm(
                            `Change ${u.name}'s role to ${role}?`,
                          );
                          if (!confirm) return;
                          setChangingUser(u.userId);
                          await changeRole.mutateAsync({ userId: u.userId, role });
                          setChangingUser(null);
                        }}
                        disabled={changingUser !== null}
                      />
                    ))}
                    {!users?.length && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 px-6">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function UserRow({
  user,
  onChangeRole,
  disabled,
}: {
  user: AdminUser;
  onChangeRole: (r: string) => void;
  disabled: boolean;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="max-w-[180px] truncate">{user.name}</div>
      </TableCell>
      <TableCell>
        <div className="max-w-[230px] truncate">{user.email}</div>
      </TableCell>
      <TableCell>
        <Badge
          variant={user.role === "admin" ? "destructive" : user.role === "operator" ? "default" : "secondary"}
        >
          {user.role.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <Button
              key={r.key}
              variant={user.role === r.key ? "secondary" : "outline"}
              size="sm"
              onClick={() => onChangeRole(r.key)}
              disabled={disabled || user.role === r.key}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
