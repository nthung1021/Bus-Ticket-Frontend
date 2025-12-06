"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  User, 
  CreditCard,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useAuth";
import UserBookingService, { type Booking, type BookingStatus } from "@/services/userBookingService";

export default function UserBookingsPage() {
  const router = useRouter();
  const { data: user, isLoading: authLoading, error: authError } = useCurrentUser();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bookingService = new UserBookingService();

  const fetchBookings = async (status?: BookingStatus) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await bookingService.getUserBookings(status);
      setBookings(data);
      setFilteredBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error instanceof Error ? error.message : 'Failed to load bookings');
      
      // If authentication error, redirect to login
      if (error instanceof Error && (error.message.includes('Authentication') || error.message.includes('Unauthorized'))) {
        router.push('/login?message=Please log in to view your bookings');
        return;
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return;
    
    // If there's an auth error (like 401), redirect to login
    if (authError) {
      console.log('Authentication error, redirecting to login:', authError);
      // Store the intended destination to redirect back after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectAfterLogin', '/user/bookings');
      }
      router.push('/login?message=Please log in to view your bookings');
      return;
    }
    
    // If auth is complete and we have a user, fetch bookings
    if (user) {
      fetchBookings();
    }
    
    // If no user and no error, it might be loading or cookie not set yet
    // Don't redirect immediately, let the query retry
  }, [user, authLoading, authError, router]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === statusFilter));
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }, [statusFilter, bookings]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBookings(statusFilter === 'all' ? undefined : statusFilter as BookingStatus);
  };

  const getStatusColor = (status: string) => {
    return UserBookingService.getStatusColor(status as BookingStatus);
  };

  const getStatusLabel = (status: string) => {
    return UserBookingService.getStatusLabel(status as BookingStatus);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? "Checking authentication..." : "Loading your bookings..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-h2 font-semibold">My Bookings</h1>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter and Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by status:</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-red-500">⚠</span>
                <span className="font-medium">Error loading bookings</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="mt-3"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <Card className="text-center p-8">
            <div className="mb-4">
              <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground">
                {statusFilter === 'all' 
                  ? "You haven't made any bookings yet."
                  : `You have no ${statusFilter} bookings.`}
              </p>
            </div>
            <Button asChild>
              <Link href="/trips">Book Your First Trip</Link>
            </Button>
          </Card>
        )}

        {/* Bookings List */}
        {currentBookings.length > 0 && (
          <div className="space-y-6">
            {currentBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {booking.trip.route.origin} → {booking.trip.route.destination}
                        </CardTitle>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Booking #{booking.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {booking.totalAmount.toLocaleString('vi-VN')} VNĐ
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Trip Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Departure</span>
                      </div>
                      <p className="font-medium">
                        {format(new Date(booking.trip.departureTime), 'PPP')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.trip.departureTime), 'p')}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bus className="w-4 h-4" />
                        <span>Bus</span>
                      </div>
                      <p className="font-medium">{booking.trip.bus.model}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.trip.bus.plateNumber}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Duration</span>
                      </div>
                      <p className="font-medium">
                        {Math.floor(booking.trip.route.estimatedMinutes / 60)}h {booking.trip.route.estimatedMinutes % 60}m
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.trip.route.distanceKm}km
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Passengers and Seats */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Passengers & Seats</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {booking.passengers.map((passenger, index) => {
                        const seat = booking.seats[index]?.seat;
                        return (
                          <div 
                            key={passenger.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">{passenger.fullName}</p>
                              <p className="text-xs text-muted-foreground">ID: {passenger.documentId}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                Seat {seat?.seatCode}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1 capitalize">
                                {seat?.seatType}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Booking Info */}
                  <Separator />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Booked: {format(new Date(booking.bookedAt), 'PPp')}
                      </span>
                      {booking.expiresAt && booking.status === 'pending' && (
                        <span className="text-yellow-600">
                          Expires: {format(new Date(booking.expiresAt), 'PPp')}
                        </span>
                      )}
                      {booking.cancelledAt && (
                        <span className="text-red-600">
                          Cancelled: {format(new Date(booking.cancelledAt), 'PPp')}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {booking.status === 'pending' && (
                        <Button size="sm" asChild>
                          <Link href={`/payment?tripId=${booking.tripId}&bookingId=${booking.id}`}>
                            Complete Payment
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/bookings/${booking.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Pagination Info */}
        {filteredBookings.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
          </div>
        )}
      </div>
    </div>
  );
}