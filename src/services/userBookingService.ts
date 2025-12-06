import api from "@/lib/api";

interface Booking {
  id: string;
  userId: string;
  tripId: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
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

export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'expired';

class UserBookingService {

  async getUserBookings(status?: BookingStatus): Promise<Booking[]> {
    try {
      const url = status 
        ? `/users/me/bookings?status=${status}`
        : '/users/me/bookings';

      const response = await api.get(url);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  async getBookingById(bookingId: string): Promise<Booking> {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch booking details');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Utility methods for UI
  static getStatusColor(status: BookingStatus): string {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  static getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending Payment';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  }

  static isBookingExpired(booking: Booking): boolean {
    if (booking.status !== 'pending' || !booking.expiresAt) {
      return false;
    }
    return new Date() > new Date(booking.expiresAt);
  }

  static canCancelBooking(booking: Booking): boolean {
    return booking.status === 'pending' || booking.status === 'paid';
  }

  static canPayBooking(booking: Booking): boolean {
    return booking.status === 'pending' && !this.isBookingExpired(booking);
  }
}

export default UserBookingService;
export type { Booking, BookingApiResponse };