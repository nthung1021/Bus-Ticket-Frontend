import api from "@/lib/api";

interface Booking {
  id: string;
  userId: string;
  tripId: string;
  reference: string;
  totalAmount: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  bookedAt: string;
  cancelledAt?: string;
  expiresAt?: string;
  trip: {
    id: string;
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
    status: string;
    route: {
      id: string;
      name: string;
      description: string;
      origin: string;
      destination: string;
      distanceKm: number;
      estimatedMinutes: number;
    };
    bus: {
      id: string;
      plateNumber: string;
      model: string;
      seatCapacity: number;
    };
  };
  passengers: {
    id: string;
    fullName: string;
    documentId: string;
    seatCode: string;
  }[];
  seats: {
    id: string;
    seatId: string;
    state: string;
    lockedUntil?: string;
    seat: {
      id: string;
      seatCode: string;
      seatType: string;
      isActive: boolean;
    };
  }[];
}

interface BookingApiResponse {
  success: boolean;
  message: string;
  data: Booking[];
}

export type BookingStatus = "pending" | "paid" | "cancelled" | "expired";

class UserBookingService {
  async getUserBookings(status?: BookingStatus): Promise<Booking[]> {
    try {
      const url = status
        ? `/users/me/bookings?status=${status}`
        : "/users/me/bookings";

      const response = await api.get(url);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch bookings");
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      throw error;
    }
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    try {
      const response = await api.get(`/bookings/${bookingId}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to fetch booking details",
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to cancel booking");
      }
    } catch (error: unknown) {
      console.error("Error cancelling booking:", error);

      // Extract backend error message
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
      }

      if (error instanceof Error && error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to cancel booking");
      }
    }
  }

  // Utility methods for UI
  static getStatusColor(status: BookingStatus): string {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  }

  static getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending Payment";
      case "cancelled":
        return "Cancelled";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  }

  static isBookingExpired(booking: Booking): boolean {
    if (booking.status !== "pending" || !booking.expiresAt) {
      return false;
    }
    return new Date() > new Date(booking.expiresAt);
  }

  static canCancelBooking(booking: Booking): boolean {
    // Allow cancelling both pending and paid bookings
    if (booking.status !== "pending" && booking.status !== "paid") {
      return false;
    }

    // Check if booking can be cancelled (at least 6 hours before departure)
    if (booking.trip?.departureTime) {
      const departureTime = new Date(booking.trip.departureTime);
      const currentTime = new Date();
      const timeDifference = departureTime.getTime() - currentTime.getTime();
      const hoursUntilDeparture = timeDifference / (1000 * 60 * 60); // Convert to hours

      // Must be at least 6 hours before departure
      return hoursUntilDeparture >= 6;
    }

    // If no departure time available, don't allow cancellation
    return false;
  }

  static canPayBooking(booking: Booking): boolean {
    return booking.status === "pending" && !this.isBookingExpired(booking);
  }
}

export default UserBookingService;
export type { Booking, BookingApiResponse };
