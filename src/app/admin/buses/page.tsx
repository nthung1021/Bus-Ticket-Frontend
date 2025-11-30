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
import { Trash2, Edit, Plus, Search } from "lucide-react";
import { busService, Bus, CreateBusDto, UpdateBusDto } from "@/services/bus.service";
import { toast } from "sonner";

export default function BusesPage() {
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <BusesManagement />
    </ProtectedRole>
  );
}

function BusesManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState<CreateBusDto>({
    operatorId: "",
    plateNumber: "",
    model: "",
    seatCapacity: 0,
    amenities: [],
  });

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const data = await busService.getAll();
      console.log(data);
      setBuses(data);
    } catch (error) {
      toast.error("Failed to fetch buses");
      console.error("Error fetching buses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBus = async () => {
    try {
      await busService.create(formData);
      toast.success("Bus created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        operatorId: "",
        plateNumber: "",
        model: "",
        seatCapacity: 0,
        amenities: [],
      });
      fetchBuses();
    } catch (error) {
      toast.error("Failed to create bus");
      console.error("Error creating bus:", error);
    }
  };

  const handleUpdateBus = async () => {
    if (!editingBus) return;

    try {
      await busService.update(editingBus.id, formData as UpdateBusDto);
      toast.success("Bus updated successfully");
      setIsEditDialogOpen(false);
      setEditingBus(null);
      setFormData({
        operatorId: "",
        plateNumber: "",
        model: "",
        seatCapacity: 0,
        amenities: [],
      });
      fetchBuses();
    } catch (error) {
      toast.error("Failed to update bus");
      console.error("Error updating bus:", error);
    }
  };

  const handleDeleteBus = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;

    try {
      await busService.delete(id);
      toast.success("Bus deleted successfully");
      fetchBuses();
    } catch (error) {
      toast.error("Failed to delete bus");
      console.error("Error deleting bus:", error);
    }
  };

  const openEditDialog = (bus: Bus) => {
    setEditingBus(bus);
    setFormData({
      operatorId: bus.operatorId,
      plateNumber: bus.plateNumber,
      model: bus.model,
      seatCapacity: bus.seatCapacity,
      amenities: bus.amenities,
    });
    setIsEditDialogOpen(true);
  };

  const filteredBuses = buses.filter(
    (bus) =>
      bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const BusForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="operatorId">Operator ID</Label>
        <Input
          id="operatorId"
          value={formData.operatorId}
          onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
          placeholder="Enter operator ID"
        />
      </div>
      <div>
        <Label htmlFor="plateNumber">Plate Number</Label>
        <Input
          id="plateNumber"
          value={formData.plateNumber}
          onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
          placeholder="Enter plate number"
        />
      </div>
      <div>
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          placeholder="Enter bus model"
        />
      </div>
      <div>
        <Label htmlFor="seatCapacity">Seat Capacity</Label>
        <Input
          id="seatCapacity"
          type="number"
          value={formData.seatCapacity}
          onChange={(e) => setFormData({ ...formData, seatCapacity: parseInt(e.target.value) || 0 })}
          placeholder="Enter seat capacity"
        />
      </div>
      <div>
        <Label htmlFor="amenities">Amenities (comma-separated)</Label>
        <Input
          id="amenities"
          value={formData.amenities.join(", ")}
          onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split(",").map(a => a.trim()).filter(a => a) })}
          placeholder="WiFi, AC, TV, USB"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => isEdit ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdateBus : handleCreateBus}>
          {isEdit ? "Update" : "Create"} Bus
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex bg-background">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Header />
        <main className="flex-1 pt-4 px-4 pb-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Bus Management</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search buses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bus
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Bus</DialogTitle>
                      </DialogHeader>
                      <BusForm />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading buses...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Seat Capacity</TableHead>
                      <TableHead>Amenities</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No buses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBuses.map((bus) => (
                        <TableRow key={bus.id}>
                          <TableCell className="font-medium">{bus.plateNumber}</TableCell>
                          <TableCell>{bus.model}</TableCell>
                          <TableCell>{bus.seatCapacity}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {bus.amenities.map((amenity, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{bus.operator?.name || bus.operatorId}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(bus)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBus(bus.id)}
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
                <DialogTitle>Edit Bus</DialogTitle>
              </DialogHeader>
              <BusForm isEdit={true} />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
