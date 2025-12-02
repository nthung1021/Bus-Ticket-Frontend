"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Header } from "@/components/dashboard/Header/Header";
import ProtectedRole from "@/components/ProtectedRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus, Search, MapPin, Clock, Ruler, ChevronDown, Wifi, Car } from "lucide-react";
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
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CreateRouteDto>({
    operatorId: "",
    name: "",
    description: "",
    origin: "",
    destination: "",
    distanceKm: 0,
    estimatedMinutes: 0,
    amenities: [],
    points: [],
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
      console.log(data);
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
        name: "",
        description: "",
        origin: "",
        destination: "",
        distanceKm: 0,
        estimatedMinutes: 0,
        amenities: [],
        points: [],
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
      // Filter out system fields from points
      const cleanedData = {
        ...formData,
        points: formData.points?.map(point => ({
          name: point.name,
          latitude: point.latitude,
          longitude: point.longitude,
          type: point.type,
          order: point.order,
          distanceFromStart: point.distanceFromStart,
          estimatedTimeFromStart: point.estimatedTimeFromStart
        })) || []
      };
      
      console.log('Updating route with cleaned data:', cleanedData);
      await routeService.update(editingRoute.id, cleanedData as UpdateRouteDto);
      toast.success("Route updated successfully");
      setIsEditDialogOpen(false);
      setEditingRoute(null);
      setFormData({
        operatorId: "",
        name: "",
        description: "",
        origin: "",
        destination: "",
        distanceKm: 0,
        estimatedMinutes: 0,
        amenities: [],
        points: [],
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
      name: route.name || '',
      description: route.description || '',
      origin: route.origin || '',
      destination: route.destination || '',
      distanceKm: route.distanceKm || 0,
      estimatedMinutes: route.estimatedMinutes || 0,
      amenities: route.amenities || [],
      points: route.points || [],
    });
    setIsEditDialogOpen(true);
  };

  const toggleRouteExpansion = (routeId: string) => {
    const newExpanded = new Set(expandedRoutes);
    if (newExpanded.has(routeId)) {
      newExpanded.delete(routeId);
    } else {
      newExpanded.add(routeId);
    }
    setExpandedRoutes(newExpanded);
  };

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = 
      route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (route.points?.some(point => point.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
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
                      <TableHead>Origin → Destination</TableHead>
                      <TableHead>Distance/Duration</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Amenities</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No routes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoutes.map((route) => (
                        <TableRow key={route.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{route.name}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {route.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{route.origin || 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">→ {route.destination || 'Unknown'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {route.distanceKm && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <Ruler className="w-3 h-3 text-muted-foreground" />
                                  <span>{route.distanceKm} km</span>
                                </div>
                              )}
                              {route.estimatedMinutes && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span>{route.estimatedMinutes} min</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {route.operator?.name || route.operatorId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <button 
                                onClick={() => toggleRouteExpansion(route.id)}
                                className="flex items-center space-x-1 text-sm hover:text-primary transition-colors"
                              >
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{route.points?.length || 0} points</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${expandedRoutes.has(route.id) ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedRoutes.has(route.id) && (
                                <div className="mt-2 space-y-1">
                                  {route.points?.slice(0, 3).map((point, index) => (
                                    <div key={point.id} className="text-xs flex items-center space-x-1">
                                      <span className="font-medium">#{point.order}</span>
                                      <span>{point.name}</span>
                                      <Badge variant="secondary" className="text-xs">
                                        {point.type}
                                      </Badge>
                                    </div>
                                  ))}
                                  {route.points && route.points.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                      ...and {route.points.length - 3} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {route.amenities?.slice(0, 2).map((amenity) => (
                                <Badge key={amenity} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {route.amenities && route.amenities.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{route.amenities.length - 2}
                                </Badge>
                              )}
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
