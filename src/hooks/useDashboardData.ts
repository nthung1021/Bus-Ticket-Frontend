import { useState, useEffect } from "react";
import UserBookingService, {
  type Booking,
  type BookingStatus,
} from "@/services/userBookingService";
import { useCurrentUser } from "@/hooks/useAuth";
import { getCurrencySymbol } from "@/utils/formatCurrency";

interface DashboardStats {
  upcomingTrips: number;
  totalTickets: number;
  totalSpent: number;
  nextTripDate?: string;
}

interface UpcomingTrip {
  id: string;
  route: string;
  busName: string;
  departureTime: string;
  arrivalTime: string;
  seatCodes: string[];
  bookingId: string;
  status: BookingStatus;
  totalAmount: number;
}

export function useDashboardData() {
  const { data: user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    upcomingTrips: 0,
    totalTickets: 0,
    totalSpent: 0,
  });
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  const bookingService = new UserBookingService();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all bookings
        const allBookings = await bookingService.getUserBookings();

        // Calculate stats
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();

        // Filter bookings by year
        const thisYearBookings = allBookings.filter((booking) => {
          const bookingDate = new Date(booking.bookedAt);
          return bookingDate.getFullYear() === currentYear;
        });

        // Calculate upcoming trips (paid bookings with future departure dates)
        const upcomingBookings = allBookings.filter((booking) => {
          if (booking.status !== "paid" || !booking.trip?.departureTime)
            return false;
          const departureDate = new Date(booking.trip.departureTime);
          return departureDate > currentDate;
        });

        // Sort upcoming trips by departure time
        upcomingBookings.sort((a, b) => {
          const dateA = new Date(a.trip!.departureTime);
          const dateB = new Date(b.trip!.departureTime);
          return dateA.getTime() - dateB.getTime();
        });

        // Get next trip date
        const nextTrip = upcomingBookings[0];
        const nextTripDate = nextTrip?.trip?.departureTime
          ? new Date(nextTrip.trip.departureTime).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined;

        // Calculate total spent this year (include paid and expired)
        const totalSpent = thisYearBookings
          .filter(
            (booking) =>
              booking.status === "paid" || booking.status === "expired",
          )
          .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);

        // Calculate total tickets this year (include paid and expired)
        const totalTickets = thisYearBookings
          .filter(
            (booking) =>
              booking.status === "paid" || booking.status === "expired",
          )
          .reduce((sum, booking) => sum + (booking.passengers?.length || 0), 0);

        // Transform upcoming bookings for display
        const upcomingTripsData: UpcomingTrip[] = upcomingBookings
          .slice(0, 3)
          .map((booking) => ({
            id: booking.id,
            route: `${booking.trip?.route?.origin} → ${booking.trip?.route?.destination}`,
            busName: booking.trip?.bus?.plateNumber || "Bus info not available",
            departureTime: booking.trip?.departureTime || "",
            arrivalTime: booking.trip?.arrivalTime || "",
            seatCodes: booking.passengers?.map((p) => p.seatCode) || [],
            bookingId: booking.id,
            status: booking.status,
            totalAmount: booking.totalAmount,
          }));

        // Get recent bookings (last 5, sorted by booking date)
        const recentBookingsData = allBookings
          .sort(
            (a, b) =>
              new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime(),
          )
          .slice(0, 5);

        // Update state
        setStats({
          upcomingTrips: upcomingBookings.length,
          totalTickets,
          totalSpent,
          nextTripDate,
        });

        setUpcomingTrips(upcomingTripsData);
        setRecentBookings(recentBookingsData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatShortCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ${getCurrencySymbol()}`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K ${getCurrencySymbol()}`;
    }
    return `${formatCurrency(amount)}`;
  };

  return {
    loading,
    error,
    stats,
    upcomingTrips,
    recentBookings,
    formatCurrency,
    formatShortCurrency,
    refetch: () => {
      if (user) {
        setLoading(true);
        // Re-trigger the effect by updating a dependency
      }
    },
  };
}
