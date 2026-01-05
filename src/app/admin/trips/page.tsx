"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
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
import { Pagination } from "@/components/ui/pagination";
import {
    getTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    refundTrip,
    getTripPayments,
    getTripById,
    markPassengerBoarded,
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
import { adminActivityService } from "@/services/admin-activity.service";

/**
 * Trip management page (Admin)
 * - Hiển thị danh sách các chuyến, cung cấp filter, sort, pagination
 * - Cho phép tạo/sửa/xóa trip, xem payments của trip đã xóa, xem passenger list và đánh dấu đã boarded
 */
function TripManagementPage() {
    // Dữ liệu gốc từ backend
    const [trips, setTrips] = useState<Trip[]>([]); // tất cả trips (bao gồm deleted nếu showDeleted = true khi gọi API)
    const [routes, setRoutes] = useState<Route[]>([]); // danh sách route để map id -> tên
    const [buses, setBuses] = useState<BusType[]>([]); // danh sách bus để map id -> plate/model

    // State cho UI, filter và paging
    const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]); // trips đã qua filter & sort
    const [isDialogOpen, setIsDialogOpen] = useState(false); // dialog create/edit
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null); // trip đang edit

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [routeFilter, setRouteFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("all");
    const [priceFilter, setPriceFilter] = useState<string>("all");

    // Sorting
    const [sortBy, setSortBy] = useState<string>("departureTime");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Loading & pagination
    const [isLoading, setIsLoading] = useState(false); // dùng cho submit/operations
    const [isInitialLoading, setIsInitialLoading] = useState(true); // loading lúc fetch ban đầu
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Hiển thị bản ghi đã xóa hay không (kích hoạt endpoint showDeleted)
    const [showDeleted, setShowDeleted] = useState(false);

    // --- Deleted trips modal state ---
    const [showDeletedModal, setShowDeletedModal] = useState(false);
    const [selectedDeletedTrip, setSelectedDeletedTrip] = useState<Trip | null>(null);
    const [deletedTripPayments, setDeletedTripPayments] = useState<any[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [refunding, setRefunding] = useState(false);

    // --- Passengers modal state ---
    const [showPassengersModal, setShowPassengersModal] = useState(false);
    const [selectedTripForPassengers, setSelectedTripForPassengers] = useState<Trip | null>(null);
    const [selectedPassengersByBooking, setSelectedPassengersByBooking] = useState<any[]>([]); // grouped by booking
    const [passengersLoading, setPassengersLoading] = useState(false);

    // Fetch dữ liệu ban đầu (trips, routes, buses)
    // Dependency: `showDeleted` - khi toggle showDeleted sẽ fetch lại (ví dụ xem trips đã xóa)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsInitialLoading(true);
                // Gọi đồng thời nhiều endpoint để tiết kiệm thời gian
                const [tripsData, routesData, busesData] = await Promise.all([
                    getTrips(showDeleted),
                    getRoutes(),
                    getBuses()
                ]);

                setTrips(tripsData);
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
    }, [showDeleted]);

    /**
     * Filter & sort trips khi có thay đổi ở các state liên quan
     * - Áp dụng search, status, route, date, price
     * - Sau đó sort theo `sortBy` và `sortOrder`
     * - Reset currentPage về 1 khi filter thay đổi
     */
    useEffect(() => {
        let filtered = trips;

        // -- Search: tìm theo route.name hoặc bus.plateNumber (case-insensitive)
        if (searchQuery) {
            filtered = filtered.filter(
                (trip) =>
                    trip.route?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    trip.bus?.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // -- Filter theo status
        if (statusFilter !== "all") {
            filtered = filtered.filter((trip) => trip.status === statusFilter);
        }

        // -- Filter theo routeId
        if (routeFilter !== "all") {
            filtered = filtered.filter((trip) => trip.routeId === routeFilter);
        }

        // -- Filter theo date range (today, tomorrow, thisWeek, upcoming, past)
        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            filtered = filtered.filter((trip) => {
                const tripDate = new Date(trip.departureTime);
                switch (dateFilter) {
                    case "today":
                        return tripDate >= today && tripDate < tomorrow;
                    case "tomorrow":
                        return tripDate >= tomorrow && tripDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
                    case "thisWeek":
                        return tripDate >= today && tripDate < nextWeek;
                    case "upcoming":
                        return tripDate >= today;
                    case "past":
                        return tripDate < today;
                    default:
                        return true;
                }
            });
        }

        // -- Filter theo price range (low/medium/high)
        if (priceFilter !== "all") {
            filtered = filtered.filter((trip) => {
                const price = trip.basePrice || 0;
                switch (priceFilter) {
                    case "low":
                        return price <= 500000; // ≤500k VND
                    case "medium":
                        return price > 500000 && price <= 1000000; // 500k-1M VND
                    case "high":
                        return price > 1000000; // >1M VND
                    default:
                        return true;
                }
            });
        }

        // -- Sort theo tiêu chí đã chọn
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "departureTime":
                    comparison = new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
                    break;
                case "bookings":
                    const aBookings = a.bookings?.length || 0;
                    const bBookings = b.bookings?.length || 0;
                    comparison = aBookings - bBookings;
                    break;
                case "route":
                    comparison = (a.route?.name || "").localeCompare(b.route?.name || "");
                    break;
                case "price":
                    comparison = (a.basePrice || 0) - (b.basePrice || 0);
                    break;
                case "status":
                    comparison = a.status.localeCompare(b.status);
                    break;
                case "bus":
                    comparison = (a.bus?.plateNumber || "").localeCompare(b.bus?.plateNumber || "");
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

        setFilteredTrips(filtered);
        setCurrentPage(1); // Reset to page 1 khi filter thay đổi
    }, [searchQuery, statusFilter, routeFilter, dateFilter, priceFilter, sortBy, sortOrder, trips]);

    // --- Pagination calculations: xác định page hiện tại ---
    const totalItems = filteredTrips.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTrips = filteredTrips.slice(startIndex, endIndex);
    const showingFrom = totalItems === 0 ? 0 : startIndex + 1;
    const showingTo = Math.min(endIndex, totalItems);

    // Open create dialog
    const handleCreateTrip = () => {
        setEditingTrip(null);
        setIsDialogOpen(true);
    };

    // Open edit dialog with selected trip
    const handleEditTrip = (trip: Trip) => {
        setEditingTrip(trip);
        setIsDialogOpen(true);
        setShowDeletedModal(false); // ensure deleted modal is closed when editing
    };

    /**
     * Xóa trip (soft-delete trên backend) và thực hiện refund nếu cần
     * - Gọi endpoint refundTrip
     * - Làm mới danh sách trips (non deleted view)
     * - Ghi log adminActivity
     */
    const handleDeleteTrip = async (tripId: string) => {
        if (confirm("Are you sure you want to delete this trip?")) {
            try {
                setIsLoading(true);

                const tripToDelete = trips.find(t => t.id === tripId);

                // Gọi refund API và show toast promise để xử lý trạng thái
                await toast.promise(
                    refundTrip(tripId),
                    {
                        loading: 'Refunding money...',
                        success: 'Refunds processed and trip marked deleted',
                        error: 'Failed to refund users',
                    }
                );

                // Refresh trips (non-deleted view)
                const refreshed = await getTrips(false);
                setTrips(refreshed);

                // Log admin action nếu cần
                if (tripToDelete) {
                    adminActivityService.addActivity(
                        'deleted',
                        'trip',
                        `${tripToDelete.route?.name || 'Route'} - ${new Date(tripToDelete.departureTime).toLocaleDateString()}`,
                        `Removed scheduled trip and issued refunds`
                    );
                }
            } catch (error) {
                console.error("Error deleting trip:", error);
                toast.error("Failed to delete and refund trip");
            } finally {
                setIsLoading(false);
            }
        }
    };

    /**
     * Submit handler cho cả create và update
     * - Format dữ liệu (dates, numbers)
     * - Gọi createTrip hoặc updateTrip
     * - Update local state và log activity
     */
    const handleSubmitTrip = async (data: any) => {
        setIsLoading(true);
        try {
            // Format data cho backend
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

                // Log admin activity
                adminActivityService.addActivity(
                    'updated',
                    'trip',
                    `${editingTrip.route?.name || 'Route'} - ${new Date(data.departureTime).toLocaleDateString()}`,
                    `Updated trip details`
                );
            } else {
                // Create new trip
                const newTrip = await createTrip(tripData as CreateTripDto);
                setTrips([...trips, newTrip]);
                toast.success("Trip created successfully");

                // Log admin activity
                const routeName = routes.find(r => r.id === data.routeId)?.name || 'Route';
                adminActivityService.addActivity(
                    'created',
                    'trip',
                    `${routeName} - ${new Date(data.departureTime).toLocaleDateString()}`,
                    `Scheduled new trip`
                );
            }

            setIsDialogOpen(false);
            setEditingTrip(null);
        } catch (error: any) {
            console.error("Error saving trip:", error);
            // Ưu tiên message từ server nếu có
            const serverMessage = error?.response?.data?.message;
            toast.error(serverMessage || error?.message || "Failed to save trip");
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Trả về Badge tuỳ theo trạng thái trip
     */
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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex bg-background min-h-screen">
            {/* Sidebar */}
            <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 lg:ml-64 flex flex-col">
                {/* Mobile Header with Menu Button */}
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

                {/* Content Area */}
                <main className="flex-1 pt-6 lg:pt-10 px-4 sm:px-6 pb-6">
                    {/* Page Header with Create Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                                Trip Management
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create, edit, and manage trip schedules
                            </p>
                        </div>
                        {/* Create Trip button (kept available) */}
                    </div>

                    {/* Compact Filters */}
                    <div className="bg-card rounded-lg p-4 mb-6 shadow-sm border border-border">
                        <div className="flex flex-col gap-4">
                            {/* First row: Search and Create button */}
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search routes, buses, origins, destinations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button onClick={() => setShowDeleted((s) => !s)} variant={showDeleted ? 'destructive' : 'default'}>
                                        {showDeleted ? 'Hide Deleted Trips' : 'Show Deleted Trips'}
                                    </Button>
                                    <Button onClick={handleCreateTrip} className="w-full md:w-auto">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Trip
                                    </Button>
                                </div>
                            </div>

                            {/* Filters Row (status/route/date/price) */}
                            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                                <span className="text-sm font-medium shrink-0">Filters:</span>
                                <div className="flex flex-wrap items-center gap-2 flex-1">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Status" />
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

                                    <Select value={routeFilter} onValueChange={setRouteFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Route" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Routes</SelectItem>
                                            {routes.map((route) => (
                                                <SelectItem key={route.id} value={route.id}>
                                                    {route.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={dateFilter} onValueChange={setDateFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Date" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Dates</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                            <SelectItem value="thisWeek">This Week</SelectItem>
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="past">Past</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Price" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Prices</SelectItem>
                                            <SelectItem value="low">Low (≤500k)</SelectItem>
                                            <SelectItem value="medium">Medium (500k-1M)</SelectItem>
                                            <SelectItem value="high">High (&gt;1M)</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Clear Filters Button - only show when filters are active */}
                                    {(searchQuery || statusFilter !== "all" || routeFilter !== "all" || dateFilter !== "all" || priceFilter !== "all") && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setStatusFilter("all");
                                                setRouteFilter("all");
                                                setDateFilter("all");
                                                setPriceFilter("all");
                                            }}
                                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            <Filter className="h-4 w-4 mr-1" />
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
                                        variant={sortBy === "departureTime" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSortBy("departureTime")}
                                        className="cursor-pointer"
                                    >
                                        <Calendar className="h-3.5 w-3.5 mr-1" />
                                        Departure
                                    </Button>
                                    <Button
                                        variant={sortBy === "bookings" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSortBy("bookings")}
                                        className="cursor-pointer"
                                    >
                                        <BusIcon className="h-3.5 w-3.5 mr-1" />
                                        Bookings
                                    </Button>
                                    <Button
                                        variant={sortBy === "route" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSortBy("route")}
                                        className="cursor-pointer"
                                    >
                                        <MapPin className="h-3.5 w-3.5 mr-1" />
                                        Route
                                    </Button>
                                    <Button
                                        variant={sortBy === "price" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSortBy("price")}
                                        className="cursor-pointer"
                                    >
                                        <DollarSign className="h-3.5 w-3.5 mr-1" />
                                        Price
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
                                        variant={sortBy === "bus" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSortBy("bus")}
                                        className="cursor-pointer"
                                    >
                                        Bus
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
                    </div>

                    {/* Trips Table */}
                    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                        {/* Showing X of Y text */}
                        <div className="px-4 pt-4 pb-2 text-sm text-muted-foreground">
                            Showing {showingFrom} to {showingTo} of {totalItems} trips
                        </div>

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
                                                    <div className="animate-spin rounded-full h-8 cursor-pointer w-8 border-b-2 border-primary"></div>
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
                                            <TableRow key={trip.id} className={`hover:bg-muted/50 ${showDeleted ? 'cursor-pointer' : ''}`} onClick={async () => {
                                                // Khi đang xem trips đã xóa, click 1 hàng sẽ mở dialog Payments của trip đó
                                                if (showDeleted) {
                                                    try {
                                                        setPaymentsLoading(true);
                                                        setSelectedDeletedTrip(trip);
                                                        setShowDeletedModal(true);
                                                        const payments = await getTripPayments(trip.id);
                                                        setDeletedTripPayments(payments);
                                                    } catch (err) {
                                                        console.error('Failed to fetch trip payments', err);
                                                        toast.error('Failed to load payments');
                                                    } finally {
                                                        setPaymentsLoading(false);
                                                    }
                                                } else {
                                                    // Khi đang xem trips thường, click 1 hàng sẽ mở dialog Passenger list
                                                    try {
                                                        setPassengersLoading(true);
                                                        setSelectedTripForPassengers(trip);
                                                        setShowPassengersModal(true);

                                                        const tripRaw = await getTripById(trip.id);
                                                        const tripData = (tripRaw as any)?.data ?? (tripRaw as any);
                                                        const bookings = tripData.bookings || [];
                                                        // Group passengers theo booking để hiển thị rõ ràng
                                                        const grouped = bookings.map((b: any) => ({
                                                            bookingReference: b.bookingReference || b.booking_reference || b.id,
                                                            bookingId: b.id,
                                                            passengers: b.passengerDetails || b.passenger_details || [],
                                                        }));

                                                        setSelectedPassengersByBooking(grouped);
                                                    } catch (err) {
                                                        console.error('Failed to fetch trip passengers', err);
                                                        toast.error('Failed to load passengers');
                                                    } finally {
                                                        setPassengersLoading(false);
                                                    }
                                                }
                                            }}>
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
                                                            onClick={(e) => { e.stopPropagation(); handleEditTrip(trip); }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        {!showDeleted && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    await handleDeleteTrip(trip.id);
                                                                }}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

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

            {/* Deleted Trip Payments Dialog */}
            <Dialog open={showDeletedModal} onOpenChange={(open) => { if (!open) { setShowDeletedModal(false); setSelectedDeletedTrip(null); setDeletedTripPayments([]); } }}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Deleted Trip Payments</DialogTitle>
                        <DialogDescription>
                            {selectedDeletedTrip ? `${selectedDeletedTrip.route?.name || ''} - ${new Date(selectedDeletedTrip.departureTime).toLocaleString()}` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {paymentsLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2">Loading payments...</p>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">{deletedTripPayments.length} payments</div>
                                    <div>
                                        <Button
                                            onClick={async () => {
                                                if (!selectedDeletedTrip) return;
                                                try {
                                                    setRefunding(true);
                                                    await toast.promise(refundTrip(selectedDeletedTrip.id), {
                                                        loading: 'Refunding money...',
                                                        success: 'Refund attempt finished',
                                                        error: 'Refund failed',
                                                    });
                                                    // refresh payments
                                                    const payments = await getTripPayments(selectedDeletedTrip.id);
                                                    setDeletedTripPayments(payments);
                                                } catch (err) {
                                                    console.error('Refund failed', err);
                                                    toast.error('Refund failed');
                                                } finally {
                                                    setRefunding(false);
                                                }
                                            }}
                                            disabled={refunding}
                                        >
                                            {refunding ? 'Refunding...' : 'Refund payments again'}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {deletedTripPayments.map((p) => (
                                        <div key={p.id} className="p-3 border rounded-md flex justify-between items-center">
                                            <div>
                                                <div className="font-medium">Payment {p.id}</div>
                                                <div className="text-xs text-muted-foreground">Booking: {p.bookingId || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">Bank: {p.bankId || 'N/A'} / {p.bankNumber || 'N/A'}</div>
                                                <div className="text-xs text-muted-foreground">Created: {new Date(p.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium">{p.amount?.toFixed?.(2) ?? p.amount}</div>
                                                <div className="text-xs text-muted-foreground">{p.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Passengers Dialog */}
            <Dialog open={showPassengersModal} onOpenChange={(open) => { if (!open) { setShowPassengersModal(false); setSelectedTripForPassengers(null); setSelectedPassengersByBooking([]); } }}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Trip Passengers</DialogTitle>
                        <DialogDescription>
                            {selectedTripForPassengers ? `${selectedTripForPassengers.route?.name || ''} - ${new Date(selectedTripForPassengers.departureTime).toLocaleString()}` : ''}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {passengersLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2">Loading passengers...</p>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-3 text-sm text-muted-foreground">
                                    {selectedPassengersByBooking.reduce((acc, b) => acc + (b.passengers?.length || 0), 0)} passengers
                                </div>

                                <div className="space-y-2">
                                    {selectedPassengersByBooking.map((b) => (
                                        <div key={b.bookingId} className="p-3 border rounded-md">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-medium">Booking {b.bookingReference}</div>
                                                <div className="text-xs text-muted-foreground">ID: {b.bookingId}</div>
                                            </div>
                                            <div className="space-y-2">
                                                {b.passengers.map((p: any) => (
                                                    <div key={p.id} className="flex justify-between items-center py-1">
                                                        <div>
                                                            <div className="font-medium">{p.fullName}</div>
                                                            <div className="text-xs text-muted-foreground">Document: {p.documentId || 'N/A'}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-sm font-medium">{p.seatCode}</div>
                                                            {p.boarded ? (
                                                                <Badge variant="secondary">Boarded</Badge>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        if (!selectedTripForPassengers) return;
                                                                        try {
                                                                            setPassengersLoading(true);
                                                                            await markPassengerBoarded(selectedTripForPassengers.id, p.id, true);
                                                                            // update local state optimistically
                                                                            setSelectedPassengersByBooking((prev) => prev.map((bb) => bb.bookingId === b.bookingId ? {
                                                                                ...bb,
                                                                                passengers: bb.passengers.map((pp: any) => pp.id === p.id ? { ...pp, boarded: true } : pp)
                                                                            } : bb));
                                                                            toast.success('Passenger marked as boarded');
                                                                        } catch (err) {
                                                                            console.error('Failed to mark boarded', err);
                                                                            toast.error('Failed to mark passenger as boarded');
                                                                        } finally {
                                                                            setPassengersLoading(false);
                                                                        }
                                                                    }}
                                                                >
                                                                    Mark boarded
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

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
