"use client";

import ProtectedRole from "src/supporters/ProtectedRole";
import Navbar from "src/supporters/Navbar";
import {
  useAdminUsers,
  useChangeUserRole,
  type AdminUser,
} from "src/hooks/useAdminUsers";
import { useState } from "react";

const ROLES = [
  { key: "customer", label: "Customer" },
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
        <Navbar />
        <div className="site-container py-12">Loading users…</div>
      </>
    );
  }
  if (isError) {
    return (
      <>
        <Navbar />
        <div className="site-container py-12">
          Error: {String(error?.message)}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <section className="site-container py-12">
        <h1 className="m-4 font-bold">Admin — Manage Users</h1>

        <div className="bg-white shadow rounded-2xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
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
                    className="px-6 py-4 text-center text-sm text-gray-500"
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
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              className={`px-3 py-1 rounded-full text-sm border ${user.role === r.key ? "bg-gray-200" : "hover:bg-gray-50"}`}
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
      return "bg-blue-100 text-blue-800";
    case "customer":
    default:
      return "bg-green-100 text-green-800";
  }
}
