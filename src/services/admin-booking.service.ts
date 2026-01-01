import api from "@/lib/api";

export interface AdminBooking {
  id: string;
  bookingReference: string;
  userId?: string;
  tripId: string;
  totalAmount: number;
  status: "pending" | "paid" | "completed" | "cancelled" | "expired";
  contactEmail?: string;
  contactPhone?: string;
  bookedAt: string;
  cancelledAt?: string;
  expiresAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  trip: {
    id: string;
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
    status: string;
    route: {
      id: string;
      name: string;
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
    documentId?: string;
    seatCode: string;
  }[];
  seats: {
    id: string;
    seatId: string;
    state: string;
    seat: {
      id: string;
      seatCode: string;
      seatType: string;
    };
  }[];
  payment?: {
    id: string;
    amount: number;
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  };
}

export interface BookingListResponse {
  success: boolean;
  message: string;
  data: AdminBooking[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface UpdateBookingStatusDto {
  status: "paid" | "completed" | "cancelled";
  reason?: string;
}

export interface RefundRequestDto {
  bookingId: string;
  amount: number;
  reason: string;
}

class AdminBookingService {
  async getAllBookings(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== "all") {
        queryParams.append("status", params.status);
      }
      if (params?.startDate) {
        queryParams.append("startDate", params.startDate);
      }
      if (params?.endDate) {
        queryParams.append("endDate", params.endDate);
      }
      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.limit) {
        queryParams.append("limit", params.limit.toString());
      }

      const url = `/admin/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await api.get(url);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch bookings");
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      throw error;
    }
  }

  async getBookingById(bookingId: string): Promise<AdminBooking> {
    try {
      const response = await api.get(`/admin/bookings/${bookingId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch booking");
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      throw error;
    }
  }

  async updateBookingStatus(
    bookingId: string,
    data: UpdateBookingStatusDto
  ): Promise<AdminBooking> {
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/status`, data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update booking status");
      }

      return response.data.data;
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  }

  async processRefund(data: RefundRequestDto): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/admin/bookings/${data.bookingId}/refund`, {
        amount: data.amount,
        reason: data.reason,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to process refund");
      }

      return response.data;
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  }
}

export const adminBookingService = new AdminBookingService();
export default adminBookingService;
