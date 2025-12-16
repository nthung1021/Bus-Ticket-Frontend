import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:3000";

export enum BookingStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

export interface BookingSession {
  bookingId: string;
  userId: string;
  tripId: string;
  createdAt: Date;
}

export interface BookingStatusEvent {
  bookingId: string;
  tripId: string;
  status: BookingStatus;
  userId?: string;
  metadata?: Record<string, unknown>;
  updatedAt?: Date;
}

export interface PaymentUpdate {
  bookingId: string;
  tripId: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  amount: number;
  paymentMethod?: string;
  transactionId?: string;
}

export interface BookingInfo {
  bookingId: string;
  bookingReference: string;
  userId?: string;
  totalAmount: number;
  status: BookingStatus;
  bookedAt: Date;
}

export interface JoinTripResponse {
  success: boolean;
  tripId: string;
}

export interface LeaveTripResponse {
  success: boolean;
  tripId: string;
}

export interface TrackBookingResponse {
  success: boolean;
  bookingId: string;
  status?: BookingStatus;
  message?: string;
}

export interface UntrackBookingResponse {
  success: boolean;
  bookingId: string;
  message?: string;
}

export interface UpdateBookingStatusResponse {
  success: boolean;
  bookingId: string;
  status?: BookingStatus;
  message?: string;
}

export interface UpdatePaymentStatusResponse {
  success: boolean;
  bookingId: string;
  paymentStatus?: string;
  bookingStatus?: BookingStatus;
  message?: string;
}

export interface CurrentBookingsResponse {
  tripId: string;
  bookings: BookingInfo[];
}

export interface BookingCreatedEvent {
  bookingId: string;
  tripId: string;
  userId?: string;
  status: BookingStatus;
  totalAmount: number;
  bookingReference: string;
  bookedAt: Date;
}

export interface BookingCancelledEvent {
  bookingId: string;
  tripId: string;
  status: BookingStatus;
  cancelledAt: Date;
  reason?: string;
}

class BookingWebSocketService {
  private socket: Socket | null = null;
  private currentTripId: string | null = null;
  private trackedBookings: Set<string> = new Set();

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(`${SOCKET_URL}/bookings`, {
        transports: ["websocket", "polling"],
        withCredentials: true,
      });

      this.socket.on("connect", () => {
        console.log("Booking WebSocket connected");
      });

      this.socket.on("disconnect", () => {
        console.log("Booking WebSocket disconnected");
        this.trackedBookings.clear();
      });

      this.socket.on("connect_error", (error) => {
        console.error("Booking WebSocket connection error:", error);
        console.error("Error details:", {
          message: error.message,
          url: `${SOCKET_URL}/bookings`,
        });

        // Check if it's a namespace error
        if (error.message?.includes("Invalid namespace")) {
          console.error(
            "Namespace error detected - checking server availability...",
          );
          console.error(`Attempting to connect to: ${SOCKET_URL}/bookings`);
        }
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.currentTripId) {
        this.leaveTrip(this.currentTripId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentTripId = null;
      this.trackedBookings.clear();
    }
  }

  joinTrip(tripId: string, userId?: string): Promise<JoinTripResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      // Validate tripId before emitting
      if (!tripId || tripId.trim() === "") {
        reject(new Error("Invalid tripId: tripId cannot be empty"));
        return;
      }

      this.currentTripId = tripId;
      this.socket.emit(
        "joinTrip",
        { tripId, userId },
        (response: JoinTripResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error("Failed to join trip"));
          }
        },
      );
    });
  }

  leaveTrip(tripId: string): Promise<LeaveTripResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "leaveTrip",
        { tripId },
        (response: LeaveTripResponse) => {
          if (response.success) {
            this.currentTripId = null;
            resolve(response);
          } else {
            reject(new Error("Failed to leave trip"));
          }
        },
      );
    });
  }

  trackBooking(
    bookingId: string,
    userId?: string,
  ): Promise<TrackBookingResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "trackBooking",
        { bookingId, userId },
        (response: TrackBookingResponse) => {
          if (response.success) {
            this.trackedBookings.add(bookingId);
            resolve(response);
          } else {
            reject(new Error(response.message || "Failed to track booking"));
          }
        },
      );
    });
  }

  untrackBooking(
    bookingId: string,
    userId?: string,
  ): Promise<UntrackBookingResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "untrackBooking",
        { bookingId, userId },
        (response: UntrackBookingResponse) => {
          if (response.success) {
            this.trackedBookings.delete(bookingId);
            resolve(response);
          } else {
            reject(new Error(response.message || "Failed to untrack booking"));
          }
        },
      );
    });
  }

  updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<UpdateBookingStatusResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "updateBookingStatus",
        { bookingId, status, userId, metadata },
        (response: UpdateBookingStatusResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(
              new Error(response.message || "Failed to update booking status"),
            );
          }
        },
      );
    });
  }

  updatePaymentStatus(
    bookingId: string,
    paymentStatus: "pending" | "completed" | "failed" | "refunded",
    amount?: number,
    paymentMethod?: string,
    transactionId?: string,
    userId?: string,
  ): Promise<UpdatePaymentStatusResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "updatePaymentStatus",
        {
          bookingId,
          paymentStatus,
          amount,
          paymentMethod,
          transactionId,
          userId,
        },
        (response: UpdatePaymentStatusResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(
              new Error(response.message || "Failed to update payment status"),
            );
          }
        },
      );
    });
  }

  // Event listeners for booking lifecycle events
  onBookingCreated(callback: (data: BookingCreatedEvent) => void) {
    if (this.socket) {
      this.socket.on("bookingCreated", callback);
    }
  }

  onBookingStatusUpdated(callback: (data: BookingStatusEvent) => void) {
    if (this.socket) {
      this.socket.on("bookingStatusUpdated", callback);
    }
  }

  onPaymentStatusUpdated(callback: (data: PaymentUpdate) => void) {
    if (this.socket) {
      this.socket.on("paymentStatusUpdated", callback);
    }
  }

  onBookingCancelled(callback: (data: BookingCancelledEvent) => void) {
    if (this.socket) {
      this.socket.on("bookingCancelled", callback);
    }
  }

  onCurrentBookings(callback: (data: CurrentBookingsResponse) => void) {
    if (this.socket) {
      this.socket.on("currentBookings", callback);
    }
  }

  onBookingStatus(
    callback: (data: {
      bookingId: string;
      tripId: string;
      status: BookingStatus;
      totalAmount: number;
      bookedAt: Date;
    }) => void,
  ) {
    if (this.socket) {
      this.socket.on("bookingStatus", callback);
    }
  }

  // Methods to remove event listeners
  offBookingCreated(callback: (data: BookingCreatedEvent) => void) {
    if (this.socket) {
      this.socket.off("bookingCreated", callback);
    }
  }

  offBookingStatusUpdated(callback: (data: BookingStatusEvent) => void) {
    if (this.socket) {
      this.socket.off("bookingStatusUpdated", callback);
    }
  }

  offPaymentStatusUpdated(callback: (data: PaymentUpdate) => void) {
    if (this.socket) {
      this.socket.off("paymentStatusUpdated", callback);
    }
  }

  offBookingCancelled(callback: (data: BookingCancelledEvent) => void) {
    if (this.socket) {
      this.socket.off("bookingCancelled", callback);
    }
  }

  offCurrentBookings(callback: (data: CurrentBookingsResponse) => void) {
    if (this.socket) {
      this.socket.off("currentBookings", callback);
    }
  }

  offBookingStatus(
    callback: (data: {
      bookingId: string;
      tripId: string;
      status: BookingStatus;
      totalAmount: number;
      bookedAt: Date;
    }) => void,
  ) {
    if (this.socket) {
      this.socket.off("bookingStatus", callback);
    }
  }

  // Utility methods
  getSocket(): Socket | null {
    return this.socket;
  }

  getCurrentTripId(): string | null {
    return this.currentTripId;
  }

  getTrackedBookings(): string[] {
    return Array.from(this.trackedBookings);
  }

  isTrackingBooking(bookingId: string): boolean {
    return this.trackedBookings.has(bookingId);
  }

  // Method to check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const bookingWebSocketService = new BookingWebSocketService();
