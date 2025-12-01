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
import { Trash2, Edit, Plus, Search, Settings } from "lucide-react";
import { busService, Bus, CreateBusDto, UpdateBusDto } from "@/services/bus.service";
import { operatorService, Operator } from "@/services/operator.service";
import { toast } from "sonner";
import BusForm from "@/components/bus/BusForm";
import SeatLayoutDialog from "@/components/seat-layout/SeatLayoutDialog";
import { seatLayoutService, SeatLayout } from "@/services/seat-layout.service";

export default function BusesPage() {
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <BusesManagement />
    </ProtectedRole>
  );
}

function BusesManagement() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [seatLayoutDialogOpen, setSeatLayoutDialogOpen] = useState(false);
  const [selectedBusForLayout, setSelectedBusForLayout] = useState<Bus | null>(null);
  const [busSeatLayouts, setBusSeatLayouts] = useState<{ [busId: string]: SeatLayout }>({});
  const [formData, setFormData] = useState<CreateBusDto>({
    operatorId: "",
    plateNumber: "",
    model: "",
    seatCapacity: 0,
    amenities: [],
  });

  useEffect(() => {
    fetchBuses();
    fetchOperators();
  }, []);

  useEffect(() => {
    // Fetch seat layouts for all buses
    buses.forEach(bus => {
      fetchBusSeatLayout(bus.id);
    });
  }, [buses]);

  const fetchOperators = async () => {
    try {
      const data = await operatorService.getAll();
      setOperators(data);
    } catch (error) {
      toast.error("Failed to fetch operators");
      console.error("Error fetching operators:", error);
    }
  };

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

  const fetchBusSeatLayout = async (busId: string) => {
    try {
      const layout = await seatLayoutService.getByBusId(busId);
      setBusSeatLayouts(prev => ({ ...prev, [busId]: layout }));
    } catch (error) {
      // Bus might not have a layout yet, which is fine
      console.log(`No seat layout found for bus ${busId}`);
    }
  };

  const openSeatLayoutDialog = (bus: Bus) => {
    setSelectedBusForLayout(bus);
    setSeatLayoutDialogOpen(true);
  };

  const handleSeatLayoutSuccess = () => {
    // Refresh seat layouts
    buses.forEach(bus => {
      fetchBusSeatLayout(bus.id);
    });
  };

  const handleBusSeatLayoutUpdate = (busId: string, layout: SeatLayout) => {
    setBusSeatLayouts(prev => ({
      ...prev,
      [busId]: layout
    }));
  };

  const filteredBuses = buses.filter(
    (bus) =>
      bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase())
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
                      <BusForm
                        formData={formData}
                        setFormData={setFormData}
                        onCancel={() => setIsCreateDialogOpen(false)}
                        onSubmit={handleCreateBus}
                        operators={operators}
                      />
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
                      <TableHead>Seat Layout</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
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
                          <TableCell>
                            {busSeatLayouts[bus.id] ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                {busSeatLayouts[bus.id].layoutType.replace('_', ' ').toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Not Configured
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openSeatLayoutDialog(bus)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
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
              <BusForm
                isEdit={true}
                formData={formData}
                setFormData={setFormData}
                onCancel={() => setIsEditDialogOpen(false)}
                onSubmit={handleUpdateBus}
                operators={operators}
              />
            </DialogContent>
          </Dialog>

          <SeatLayoutDialog
            busId={selectedBusForLayout?.id || ''}
            busPlateNumber={selectedBusForLayout?.plateNumber || ''}
            open={seatLayoutDialogOpen}
            onOpenChange={setSeatLayoutDialogOpen}
            existingLayout={selectedBusForLayout ? busSeatLayouts[selectedBusForLayout.id] : undefined}
            onSuccess={handleSeatLayoutSuccess}
            onBusSeatLayoutUpdate={handleBusSeatLayoutUpdate}
          />
        </main>
      </div>
    </div>
  );
}
