// Test utility to create mock bookings for development
import { type Booking } from "@/services/userBookingService";

export const createMockBooking = (bookingId?: string): Booking => {
  const now = new Date();
  const departureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const arrivalTime = new Date(departureTime.getTime() + 4 * 60 * 60 * 1000); // 4 hours later
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now

  // Use a valid UUID format for mock booking ID
  const mockBookingId = bookingId || "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

  return {
    id: mockBookingId,
    userId: "user-123",
    tripId: "trip-123",
    reference: "BK20251207-QTCK8J",
    totalAmount: 250000,
    status: "pending" as const,
    bookedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    trip: {
      id: "trip-123",
      departureTime: departureTime.toISOString(),
      arrivalTime: arrivalTime.toISOString(),
      basePrice: 200000,
      status: "active",
      route: {
        id: "route-123",
        name: "Hanoi - Ho Chi Minh City",
        description: "Express route from Hanoi to Ho Chi Minh City",
        origin: "Hanoi",
        destination: "Ho Chi Minh City",
        distanceKm: 1700,
        estimatedMinutes: 1200,
      },
      bus: {
        id: "bus-123",
        plateNumber: "29A-123.45",
        model: "Thaco Universe 47 seats",
        seatCapacity: 47,
      },
    },
    passengers: [
      {
        id: "passenger-1",
        fullName: "Nguyen Van A",
        documentId: "123456789",
        seatCode: "A1",
      },
    ],
    seats: [
      {
        id: "seat-status-1",
        seatId: "seat-1",
        state: "booked",
        seat: {
          id: "seat-1",
          seatCode: "A1",
          seatType: "normal",
          isActive: true,
        },
      },
    ],
  };
};

export const isDevelopment = process.env.NODE_ENV === "development";
