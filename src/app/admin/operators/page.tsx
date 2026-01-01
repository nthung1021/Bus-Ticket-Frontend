"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import ProtectedRole from "@/components/ProtectedRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { operatorService, Operator, CreateOperatorDto, UpdateOperatorDto, OperatorStatus } from "@/services/operator.service";
import { adminActivityService } from "@/services/admin-activity.service";
import { toast } from "react-hot-toast";
import OperatorForm from "@/components/operator/OperatorForm";
import { Pagination } from "@/components/ui/pagination";

export default function OperatorsPage() {
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <OperatorsManagement />
    </ProtectedRole>
  );
}

function OperatorsManagement() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OperatorStatus | "all">("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [formData, setFormData] = useState<CreateOperatorDto>({
    name: "",
    contactEmail: "",
    contactPhone: "",
    status: OperatorStatus.PENDING,
  });

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const data = await operatorService.getAll();
      setOperators(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch operators");
      console.error("Error fetching operators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperator = async () => {
    try {
      await operatorService.create(formData);
      toast.success("Operator created successfully");
      
      // Log admin activity
      adminActivityService.addActivity(
        'created',
        'operator',
        formData.name,
        `New operator added with status: ${formData.status}`
      );
      
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        contactEmail: "",
        contactPhone: "",
        status: OperatorStatus.PENDING,
      });
      fetchOperators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create operator");
      console.error("Error creating operator:", error);
    }
  };

  const handleUpdateOperator = async () => {
    if (!editingOperator) return;

    try {
      await operatorService.update(editingOperator.id, formData as UpdateOperatorDto);
      toast.success("Operator updated successfully");
      
      // Log admin activity
      adminActivityService.addActivity(
        'updated',
        'operator',
        editingOperator.name,
        `Updated operator details`
      );
      
      setIsEditDialogOpen(false);
      setEditingOperator(null);
      setFormData({
        name: "",
        contactEmail: "",
        contactPhone: "",
        status: OperatorStatus.PENDING,
      });
      fetchOperators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update operator");
      console.error("Error updating operator:", error);
    }
  };

  const handleDeleteOperator = async (id: string) => {
    if (!confirm("Are you sure you want to delete this operator?")) return;

    try {
      // Get operator info before deletion for activity log
      const operatorToDelete = operators.find(o => o.id === id);
      
      await operatorService.delete(id);
      toast.success("Operator deleted successfully");
      
      // Log admin activity
      if (operatorToDelete) {
        adminActivityService.addActivity(
          'deleted',
          'operator',
          operatorToDelete.name,
          `Removed operator from system`
        );
      }
      
      fetchOperators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete operator");
      console.error("Error deleting operator:", error);
    }
  };

  const handleApproveOperator = async (id: string) => {
    try {
      // Get operator info for activity log
      const operatorToApprove = operators.find(o => o.id === id);
      
      await operatorService.approve(id);
      toast.success("Operator approved successfully");
      
      // Log admin activity
      if (operatorToApprove) {
        adminActivityService.addActivity(
          'approved',
          'operator',
          operatorToApprove.name,
          `Operator approved for service`
        );
      }
      
      fetchOperators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve operator");
      console.error("Error approving operator:", error);
    }
  };

  const handleSuspendOperator = async (id: string) => {
    try {
      // Get operator info for activity log
      const operatorToSuspend = operators.find(o => o.id === id);
      
      await operatorService.suspend(id);
      toast.success("Operator suspended successfully");
      
      // Log admin activity
      if (operatorToSuspend) {
        adminActivityService.addActivity(
          'suspended',
          'operator',
          operatorToSuspend.name,
          `Operator suspended from service`
        );
      }
      
      fetchOperators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to suspend operator");
      console.error("Error suspending operator:", error);
    }
  };

  const openEditDialog = (operator: Operator) => {
    setEditingOperator(operator);
    setFormData({
      name: operator.name,
      contactEmail: operator.contactEmail,
      contactPhone: operator.contactPhone,
      status: operator.status,
    });
    setIsEditDialogOpen(true);
  };

  const filteredOperators = operators.filter((operator) => {
    const matchesSearch = 
      operator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.contactPhone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || operator.status === statusFilter;
    
    const matchesDate = dateFilter === "all" ||
      (dateFilter === "recent" && operator.approvedAt && new Date(operator.approvedAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === "thisMonth" && operator.approvedAt && new Date(operator.approvedAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesStatus && matchesDate;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "email":
        comparison = a.contactEmail.localeCompare(b.contactEmail);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "approved":
        const aDate = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
        const bDate = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
        comparison = aDate - bDate;
        break;
      case "busCount":
        comparison = (a.buses?.length || 0) - (b.buses?.length || 0);
        break;
      default:
        comparison = 0;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Pagination calculations
  const totalItems = filteredOperators.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOperators = filteredOperators.slice(startIndex, endIndex);
  const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalItems);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  const getStatusBadge = (status: OperatorStatus) => {
    switch (status) {
      case OperatorStatus.APPROVED:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
      case OperatorStatus.SUSPENDED:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Suspended</Badge>;
      case OperatorStatus.PENDING:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col">
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
        <main className="flex-1 pt-6 lg:pt-10 px-4 pb-4">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                Operator Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage bus operators
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto shrink-0 cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Operator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Operator</DialogTitle>
                </DialogHeader>
                <OperatorForm
                  formData={formData}
                  setFormData={setFormData}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  onSubmit={handleCreateOperator}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Compact Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search operators, emails, phones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                  <span className="text-sm font-medium shrink-0">Filters:</span>
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OperatorStatus | "all")}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value={OperatorStatus.PENDING}>Pending</SelectItem>
                        <SelectItem value={OperatorStatus.APPROVED}>Approved</SelectItem>
                        <SelectItem value={OperatorStatus.SUSPENDED}>Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="recent">Last 7 days</SelectItem>
                        <SelectItem value="thisMonth">This month</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Clear Filters Button */}
                    {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setDateFilter("all");
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
                      variant={sortBy === "status" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("status")}
                      className="cursor-pointer"
                    >
                      Status
                    </Button>
                    <Button
                      variant={sortBy === "approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("approved")}
                      className="cursor-pointer"
                    >
                      Approved
                    </Button>
                    <Button
                      variant={sortBy === "busCount" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy("busCount")}
                      className="cursor-pointer"
                    >
                      Bus Count
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

          <Card>
            <CardHeader>
              <CardTitle>Operators</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading operators...</div>
              ) : (
                <>
                  {/* Showing X of Y text */}
                  <div className="mb-4 text-sm text-muted-foreground">
                    Showing {showingFrom} to {showingTo} of {totalItems} operators
                  </div>
                  
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Email</TableHead>
                      <TableHead>Contact Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOperators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No operators found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOperators.map((operator) => (
                        <TableRow key={operator.id}>
                          <TableCell className="font-medium">{operator.name}</TableCell>
                          <TableCell>{operator.contactEmail}</TableCell>
                          <TableCell>{operator.contactPhone}</TableCell>
                          <TableCell>{getStatusBadge(operator.status)}</TableCell>
                          <TableCell>
                            {operator.approvedAt 
                              ? new Date(operator.approvedAt).toLocaleDateString()
                              : "-"
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {operator.status === OperatorStatus.PENDING && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveOperator(operator.id)}
                                  className="text-green-600 hover:text-green-700 cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {operator.status === OperatorStatus.APPROVED && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuspendOperator(operator.id)}
                                  className="text-orange-600 hover:text-orange-700 cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(operator)}
                                className="cursor-pointer"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteOperator(operator.id)}
                                className="text-destructive hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {totalItems > 0 && (
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
              </>
            )}
            </CardContent>
          </Card>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Operator</DialogTitle>
              </DialogHeader>
              <OperatorForm
                isEdit={true}
                formData={formData}
                setFormData={setFormData}
                onCancel={() => setIsEditDialogOpen(false)}
                onSubmit={handleUpdateOperator}
              />
            </DialogContent>
          </Dialog>
        </main>
    </div>
  </div>
  );
}
