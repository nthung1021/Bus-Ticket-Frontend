"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Header } from "@/components/dashboard/Header/Header";
import { TripForm } from "@/components/dashboard/TripForm/TripForm";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Calendar,
    MapPin,
    Bus as BusIcon,
    DollarSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import ProtectedRole from "@/components/ProtectedRole";
import {
    getTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    getRoutes,
    getBuses,
    Trip,
    Route,
    Bus as BusType,
    CreateTripDto,
    UpdateTripDto,
    formatDateForBackend,
    formatDateFromBackend,
    TripStatus,
} from "@/services/trip.service";

function TripManagementPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [buses, setBuses] = useState<BusType[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsInitialLoading(true);
                const [tripsData, routesData, busesData] = await Promise.all([
                    getTrips(),
                    getRoutes(),
                    getBuses()
                ]);
                setTrips(tripsData);
                console.log(tripsData)
                setRoutes(routesData);
                setBuses(busesData);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load data");
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter trips based on search and status
    useEffect(() => {
        let filtered = trips;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(
                (trip) =>
                    trip.route?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    trip.bus?.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((trip) => trip.status === statusFilter);
        }

        setFilteredTrips(filtered);
    }, [searchQuery, statusFilter, trips]);

    const handleCreateTrip = () => {
        setEditingTrip(null);
        setIsDialogOpen(true);
    };

    const handleEditTrip = (trip: Trip) => {
        setEditingTrip(trip);
        setIsDialogOpen(true);
    };

    const handleDeleteTrip = async (tripId: string) => {
        if (confirm("Are you sure you want to delete this trip?")) {
            try {
                setIsLoading(true);
                await deleteTrip(tripId);
                setTrips(trips.filter((t) => t.id !== tripId));
                toast.success("Trip deleted successfully");
            } catch (error) {
                console.error("Error deleting trip:", error);
                toast.error("Failed to delete trip");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleSubmitTrip = async (data: any) => {
        setIsLoading(true);
        try {
            // Format data for backend
            const tripData: CreateTripDto | UpdateTripDto = {
                routeId: data.routeId,
                busId: data.busId,
                departureTime: formatDateForBackend(data.departureTime),
                arrivalTime: formatDateForBackend(data.arrivalTime),
                basePrice: parseFloat(data.basePrice),
                status: data.status || TripStatus.SCHEDULED,
            };

            if (editingTrip) {
                // Update existing trip
                const updatedTrip = await updateTrip(editingTrip.id, tripData as UpdateTripDto);
                setTrips(trips.map((t) => t.id === editingTrip.id ? updatedTrip : t));
                toast.success("Trip updated successfully");
            } else {
                // Create new trip
                const newTrip = await createTrip(tripData as CreateTripDto);
                setTrips([...trips, newTrip]);
                toast.success("Trip created successfully");
            }

            setIsDialogOpen(false);
            setEditingTrip(null);
        } catch (error: any) {
            console.error("Error saving trip:", error);
            
            // Extract detailed error message
            let errorMessage = "Failed to save trip";
            
            if (error.response) {
                // Server responded with error status
                const serverError = error.response.data;
                if (serverError.message) {
                    errorMessage = serverError.message;
                } else if (serverError.error) {
                    errorMessage = serverError.error;
                } else if (Array.isArray(serverError.message)) {
                    errorMessage = serverError.message.join(', ');
                }
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = "Network error. Please check your connection.";
            } else if (error.message) {
                // Client-side error
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: Trip["status"]) => {
        const variants: Record<Trip["status"], { variant: any; label: string }> = {
            scheduled: { variant: "default", label: "Scheduled" },
            in_progress: { variant: "secondary", label: "In Progress" },
            completed: { variant: "outline", label: "Completed" },
            cancelled: { variant: "destructive", label: "Cancelled" },
            delayed: { variant: "secondary", label: "Delayed" },
        };

        const config = variants[status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="flex bg-background min-h-screen">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col">
                {/* Header */}
                <Header />

                {/* Content Area */}
                <main className="flex-1 p-6">
                    {/* Page Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Trip Management
                        </h1>
                        <p className="text-muted-foreground">
                            Create, edit, and manage trip schedules
                        </p>
                    </div>

                    {/* Filters and Actions */}
                    <div className="bg-card rounded-lg p-4 mb-6 shadow-sm border border-border">
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search routes, buses..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Status Filter */}
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="delayed">Delayed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Create Button */}
                            <Button onClick={handleCreateTrip} className="w-full md:w-auto">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Trip
                            </Button>
                        </div>
                    </div>

                    {/* Trips Table */}
                    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Bus</TableHead>
                                        <TableHead>Departure</TableHead>
                                        <TableHead>Arrival</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isInitialLoading ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center py-12 text-muted-foreground"
                                            >
                                                <div className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                </div>
                                                <p className="text-lg font-medium mt-4">Loading trips...</p>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredTrips.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center py-12 text-muted-foreground"
                                            >
                                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p className="text-lg font-medium">No trips found</p>
                                                <p className="text-sm">
                                                    {searchQuery || statusFilter !== "all"
                                                        ? "Try adjusting your filters"
                                                        : "Create your first trip to get started"}
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTrips.map((trip) => (
                                            <TableRow key={trip.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        <div>
                                                            <div className="font-medium">
                                                                {trip.route?.name || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <BusIcon className="h-4 w-4 text-accent" />
                                                        <div>
                                                            <div className="font-medium">
                                                                {trip.bus?.plateNumber}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {trip.bus?.model}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {format(trip.departureTime, "PPP")}
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(trip.departureTime, "HH:mm")}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {format(trip.arrivalTime, "PPP")}
                                                        <div className="text-xs text-muted-foreground">
                                                            {format(trip.arrivalTime, "HH:mm")}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 font-medium">
                                                        <DollarSign className="h-3 w-3" />
                                                        {typeof trip.basePrice === 'number' 
                                                            ? trip.basePrice.toFixed(2) 
                                                            : parseFloat(trip.basePrice || '0').toFixed(2)
                                                        }
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(trip.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditTrip(trip)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteTrip(trip.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                            <div className="text-sm text-muted-foreground mb-1">
                                Total Trips
                            </div>
                            <div className="text-2xl font-bold">{trips.length}</div>
                        </div>
                        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                            <div className="text-sm text-muted-foreground mb-1">
                                Scheduled
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {trips.filter((t) => t.status === "scheduled").length}
                            </div>
                        </div>
                        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                            <div className="text-sm text-muted-foreground mb-1">
                                In Progress
                            </div>
                            <div className="text-2xl font-bold text-accent">
                                {trips.filter((t) => t.status === "in_progress").length}
                            </div>
                        </div>
                        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                            <div className="text-sm text-muted-foreground mb-1">
                                Completed
                            </div>
                            <div className="text-2xl font-bold text-muted-foreground">
                                {trips.filter((t) => t.status === "completed").length}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTrip ? "Edit Trip" : "Create New Trip"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingTrip
                                ? "Update the trip details below"
                                : "Fill in the details to create a new trip"}
                        </DialogDescription>
                    </DialogHeader>
                    <TripForm
                        initialData={editingTrip || undefined}
                        onSubmit={handleSubmitTrip}
                        onCancel={() => {
                            setIsDialogOpen(false);
                            setEditingTrip(null);
                        }}
                        routes={routes}
                        buses={buses}
                        isLoading={isLoading}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function TripsPage() {
    return (
        <ProtectedRole allowed={["ADMIN"]}>
            <TripManagementPage />
        </ProtectedRole>
    );
}
