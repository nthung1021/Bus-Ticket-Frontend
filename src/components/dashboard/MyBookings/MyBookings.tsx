"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Bus, 
  User, 
  CreditCard,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useAuth";
import UserBookingService, { type Booking, type BookingStatus } from "@/services/userBookingService";

interface MyBookingsProps {
  isSection?: boolean; // true for dashboard section, false for full page
  maxItems?: number; // limit items shown in section view
  showFilters?: boolean; // show filters in section view
}

export function MyBookings({ 
  isSection = false, 
  maxItems = 3,
  showFilters = true 
}: MyBookingsProps) {
  const router = useRouter();
  const { data: user, isLoading: authLoading, error: authError } = useCurrentUser();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(isSection ? maxItems : 5);
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
      setCurrentPage(1); // Reset to first page when data changes
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBookings(statusFilter === 'all' ? undefined : statusFilter as BookingStatus);
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
  }, [user, authLoading, authError, router]);

  useEffect(() => {
    // Re-fetch bookings when filter changes to use API-level filtering
    if (user) {
      fetchBookings(statusFilter === 'all' ? undefined : statusFilter as BookingStatus);
    }
  }, [statusFilter, user]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-accent text-accent-foreground border-accent/30';
      case 'pending':
        return 'bg-secondary text-secondary-foreground border-border';
      case 'cancelled':
        return 'bg-destructive/60 text-destructive-foreground border-destructive/30';
      case 'expired':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      paid: 'Paid',
      pending: 'Pending',
      cancelled: 'Cancelled',
      expired: 'Expired'
    };
    return statusLabels[status.toLowerCase()] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  if (authLoading) {
    return (
      <div className={`${isSection ? 'space-y-4' : 'min-h-screen flex items-center justify-center'}`}>
        <div className="text-center">
          <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className={`${isSection ? 'space-y-4' : 'min-h-screen flex items-center justify-center'}`}>
        <div className="text-center text-red-600">
          <p>Please log in to view your bookings</p>
        </div>
      </div>
    );
  }

  const content = (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-h2 font-semibold text-foreground">
            {isSection ? 'Recent Bookings' : 'My Bookings'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isSection ? 'Your latest booking activity' : 'View and manage your bus ticket bookings'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {showFilters && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {isSection && (
            <Button asChild size="sm">
              <Link href="/user/bookings" className="flex items-center gap-2">
                View All
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && currentBookings.length === 0 && (
        <div className="text-center py-12">
          <Bus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-h3 font-medium mb-2">No bookings found</h3>
          <p className="text-muted-foreground mb-4">
            {statusFilter === 'all' 
              ? "You haven't made any bookings yet." 
              : `No bookings with status "${getStatusLabel(statusFilter)}" found.`}
          </p>
          <Button asChild>
            <Link href="/search">Book Your First Trip</Link>
          </Button>
        </div>
      )}

      {/* Bookings List */}
      {!loading && !error && currentBookings.length > 0 && (
        <div className="space-y-4">
          {currentBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Main booking info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-h3 font-semibold">
                          {booking.trip?.route?.origin} → {booking.trip?.route?.destination}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Booking ID: {booking.id}
                        </p>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.trip?.departureTime 
                            ? format(new Date(booking.trip.departureTime), 'MMM dd, yyyy')
                            : 'Date not available'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.trip?.departureTime 
                            ? format(new Date(booking.trip.departureTime), 'HH:mm')
                            : 'Time not available'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.trip?.bus?.plateNumber || 'Bus info not available'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.passengers?.length || 0} passenger{booking.passengers?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price and actions */}
                  <div className="lg:w-1/4 lg:text-right">
                    <div className="flex items-center gap-2 lg:justify-end mb-4">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-h3 font-semibold">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                    </div>
                    <div className="flex gap-2 lg:justify-end">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/bookings/${booking.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination - Only show for non-section view or when needed */}
      {!loading && !error && totalPages > 1 && !isSection && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of{' '}
            {filteredBookings.length} bookings
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );

  // For section view, wrap in a card
  if (isSection) {
    return (
      <div className="bg-card/80 dark:bg-black/90 rounded-md p-4 md:p-6 shadow-sm border border-border backdrop-blur-sm">
        {content}
      </div>
    );
  }

  // For full page view, return content directly
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {content}
    </div>
  );
}