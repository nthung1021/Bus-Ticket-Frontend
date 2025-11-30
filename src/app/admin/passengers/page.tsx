"use client";

import ProtectedRole from "@/components/ProtectedRole";
import Navbar from "@/components/Navbar";
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
      <>
        <div className="site-container py-12">Loading users…</div>
      </>
    );
  }
  if (isError) {
    return (
      <>
        <div className="site-container py-12">
          Error: {String(error?.message)}
        </div>
      </>
    );
  }

  return (
    <>
      <section className="site-container py-12">
        <h1 className="m-4 font-bold text-h2">Admin — Manage Passengers</h1>

        <div className="bg-background rounded-2xl">
          <table className="min-w-full divide-y divide-foreground">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-foreground">
                  Action - Change Role
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-foreground">
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
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-sm text-foreground"
                  >
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
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
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass(user.role)}`}
        >
          {user.role.toLocaleUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              className={
                `px-3 py-1 rounded-full text-sm border-foreground border-2
                ${user.role === r.key ? "bg-gray-400" : "hover:bg-gray-300"}`}
              onClick={() => onChangeRole(r.key)}
              disabled={disabled || user.role === r.key}
            >
              {r.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

function badgeClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800";
    case "operator":
      return "bg-primary/10 text-primary";
    case "customer":
      return "bg-green-100 text-green-800";
  }
}
