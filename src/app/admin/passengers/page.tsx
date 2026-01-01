"use client";

import ProtectedRole from "@/components/ProtectedRole";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, XCircle } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import {
  useAdminUsers,
  useChangeUserRole,
  type AdminUser,
} from "src/hooks/useAdminUsers";
import { adminActivityService } from "@/services/admin-activity.service";
import { useState } from "react";
import { CreateAccountDialog } from "@/components/dashboard/CreateAccountDialog/CreateAccountDialog";

const ROLES = [
  { key: "customer", label: "Passenger" },
  { key: "admin", label: "Admin" },
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
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // Mobile menu state - must be at top level before any conditional returns
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter and sort users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "email":
        comparison = a.email.localeCompare(b.email);
        break;
      case "role":
        comparison = a.role.localeCompare(b.role);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  }) || [];

  // Pagination calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalItems);

  if (isLoading) {
    return (
      <div className="flex bg-background min-h-screen overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <main className="flex-1 pt-10 px-6 pb-6 overflow-auto">
            <div className="text-center py-8">Loading users…</div>
          </main>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex bg-background min-h-screen overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <main className="flex-1 pt-10 px-6 pb-6 overflow-auto">
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
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <main className="flex-1 pt-6 lg:pt-10 px-4 sm:px-6 pb-6 overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">User Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user accounts and roles
              </p>
            </div>
            <Button onClick={() => setIsCreateAccountOpen(true)} className="w-full sm:w-auto shrink-0 cursor-pointer">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </div>

          {/* Compact Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                  <span className="text-sm font-medium shrink-0">Filters:</span>
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Clear Filters Button */}
                    {(searchTerm || roleFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setRoleFilter("all");
                        }}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Sort Options */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 pt-3 border-t">
                  <span className="text-sm font-medium shrink-0">Sort by:</span>
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Button
                      variant={sortBy === "name" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("name")}
                      className="cursor-pointer"
                    >
                      Name
                    </Button>
                    <Button
                      variant={sortBy === "email" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("email")}
                      className="cursor-pointer"
                    >
                      Email
                    </Button>
                    <Button
                      variant={sortBy === "role" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("role")}
                      className="cursor-pointer"
                    >
                      Role
                    </Button>
                    
                    <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="cursor-pointer"
                    >
                      {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Showing X of Y text */}
              <div className="px-4 pt-4 pb-2 text-sm text-muted-foreground">
                Showing {showingFrom} to {showingTo} of {totalItems} users
              </div>
              
              <div className="overflow-x-auto px-4">
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
                    {paginatedUsers?.map((u) => (
                      <UserRow
                        key={u.userId}
                        user={u}
                        onChangeRole={async (role) => {
                          const confirm = window.confirm(
                            `Change ${u.name}'s role to ${role}?`,
                          );
                          if (!confirm) return;
                          setChangingUser(u.userId);
                          
                          const oldRole = u.role;
                          await changeRole.mutateAsync({ userId: u.userId, role });
                          
                          // Log admin activity
                          adminActivityService.addActivity(
                            'updated',
                            'user',
                            u.name,
                            `Changed role from ${oldRole} to ${role}`
                          );
                          
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  showingFrom={showingFrom}
                  showingTo={showingTo}
                />
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <CreateAccountDialog 
        open={isCreateAccountOpen} 
        onOpenChange={setIsCreateAccountOpen} 
      />
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
          variant={user.role === "admin" ? "destructive" : "secondary"}
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
              className="cursor-pointer"
            >
              {r.label}
            </Button>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
