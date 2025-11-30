"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Header } from "@/components/dashboard/Header/Header";
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
import { toast } from "sonner";
import OperatorForm from "@/components/operator/OperatorForm";

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
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
      toast.error("Failed to fetch operators");
      console.error("Error fetching operators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperator = async () => {
    try {
      await operatorService.create(formData);
      toast.success("Operator created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        contactEmail: "",
        contactPhone: "",
        status: OperatorStatus.PENDING,
      });
      fetchOperators();
    } catch (error) {
      toast.error("Failed to create operator");
      console.error("Error creating operator:", error);
    }
  };

  const handleUpdateOperator = async () => {
    if (!editingOperator) return;

    try {
      await operatorService.update(editingOperator.id, formData as UpdateOperatorDto);
      toast.success("Operator updated successfully");
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
      toast.error("Failed to update operator");
      console.error("Error updating operator:", error);
    }
  };

  const handleDeleteOperator = async (id: string) => {
    if (!confirm("Are you sure you want to delete this operator?")) return;

    try {
      await operatorService.delete(id);
      toast.success("Operator deleted successfully");
      fetchOperators();
    } catch (error) {
      toast.error("Failed to delete operator");
      console.error("Error deleting operator:", error);
    }
  };

  const handleApproveOperator = async (id: string) => {
    try {
      await operatorService.approve(id);
      toast.success("Operator approved successfully");
      fetchOperators();
    } catch (error) {
      toast.error("Failed to approve operator");
      console.error("Error approving operator:", error);
    }
  };

  const handleSuspendOperator = async (id: string) => {
    try {
      await operatorService.suspend(id);
      toast.success("Operator suspended successfully");
      fetchOperators();
    } catch (error) {
      toast.error("Failed to suspend operator");
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
    
    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="flex bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header />
        <main className="flex-1 pt-4 px-4 pb-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Operator Management</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search operators..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OperatorStatus | "all")}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value={OperatorStatus.PENDING}>Pending</SelectItem>
                      <SelectItem value={OperatorStatus.APPROVED}>Approved</SelectItem>
                      <SelectItem value={OperatorStatus.SUSPENDED}>Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
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
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading operators...</div>
              ) : (
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
                    {filteredOperators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No operators found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOperators.map((operator) => (
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
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {operator.status === OperatorStatus.APPROVED && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSuspendOperator(operator.id)}
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(operator)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteOperator(operator.id)}
                                className="text-destructive hover:text-destructive"
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
