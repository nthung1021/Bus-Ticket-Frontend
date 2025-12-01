"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Header } from "@/components/dashboard/Header/Header";
import ProtectedRole from "@/components/ProtectedRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, Search, MapPin, Clock, Ruler } from "lucide-react";
import { routeService, Route, CreateRouteDto, UpdateRouteDto } from "@/services/route.service";
import { operatorService, Operator } from "@/services/operator.service";
import { toast } from "sonner";
import RouteForm from "@/components/route/RouteForm";

export default function RoutesPage() {
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <RoutesManagement />
    </ProtectedRole>
  );
}

function RoutesManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [operatorFilter, setOperatorFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<CreateRouteDto>({
    operatorId: "",
    origin: "",
    destination: "",
    distanceKm: 0,
    estimatedMinutes: 0,
  });

  useEffect(() => {
    fetchRoutes();
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const data = await operatorService.getAll();
      setOperators(data);
    } catch (error) {
      toast.error("Failed to fetch operators");
      console.error("Error fetching operators:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const data = await routeService.getAll();
      setRoutes(data);
    } catch (error) {
      toast.error("Failed to fetch routes");
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    try {
      await routeService.create(formData);
      toast.success("Route created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        operatorId: "",
        origin: "",
        destination: "",
        distanceKm: 0,
        estimatedMinutes: 0,
      });
      fetchRoutes();
    } catch (error) {
      toast.error("Failed to create route");
      console.error("Error creating route:", error);
    }
  };

  const handleUpdateRoute = async () => {
    if (!editingRoute) return;

    try {
      await routeService.update(editingRoute.id, formData as UpdateRouteDto);
      toast.success("Route updated successfully");
      setIsEditDialogOpen(false);
      setEditingRoute(null);
      setFormData({
        operatorId: "",
        origin: "",
        destination: "",
        distanceKm: 0,
        estimatedMinutes: 0,
      });
      fetchRoutes();
    } catch (error) {
      toast.error("Failed to update route");
      console.error("Error updating route:", error);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    try {
      await routeService.delete(id);
      toast.success("Route deleted successfully");
      fetchRoutes();
    } catch (error) {
      toast.error("Failed to delete route");
      console.error("Error deleting route:", error);
    }
  };

  const openEditDialog = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      operatorId: route.operatorId,
      origin: route.origin,
      destination: route.destination,
      distanceKm: route.distanceKm,
      estimatedMinutes: route.estimatedMinutes,
    });
    setIsEditDialogOpen(true);
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = 
      route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.operator?.name && route.operator.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesOperator = operatorFilter === "all" || route.operatorId === operatorFilter;
    
    return matchesSearch && matchesOperator;
  });

  return (
    <div className="flex bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header />
        <main className="flex-1 pt-4 px-4 pb-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Route Management</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search routes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Operators</SelectItem>
                      {operators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id}>
                          {operator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Route
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Route</DialogTitle>
                      </DialogHeader>
                      <RouteForm
                        formData={formData}
                        setFormData={setFormData}
                        onCancel={() => setIsCreateDialogOpen(false)}
                        onSubmit={handleCreateRoute}
                        operators={operators}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading routes...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No routes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoutes.map((route) => (
                        <TableRow key={route.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{route.origin}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{route.destination}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {route.operator?.name || route.operatorId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Ruler className="w-4 h-4 text-muted-foreground" />
                              <span>{route.distanceKm} km</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{route.estimatedMinutes} min</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {route.trips?.length || 0} trips
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(route)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRoute(route.id)}
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
                <DialogTitle>Edit Route</DialogTitle>
              </DialogHeader>
              <RouteForm
                isEdit={true}
                formData={formData}
                setFormData={setFormData}
                onCancel={() => setIsEditDialogOpen(false)}
                onSubmit={handleUpdateRoute}
                operators={operators}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
