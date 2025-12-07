import api from "@/lib/api";

export enum SeatState {
  AVAILABLE = "available",
  BOOKED = "booked",
  LOCKED = "locked",
  RESERVED = "reserved",
}

export interface SeatStatus {
  id: string;
  tripId: string;
  seatId: string;
  bookingId?: string;
  state: SeatState;
  lockedUntil?: string;
  trip: {
    id: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
  };
  seat: {
    id: string;
    seatCode: string;
    seatType: string;
    isActive: boolean;
  };
  booking?: {
    id: string;
    bookingCode: string;
    status: string;
    createdAt: string;
  };
}

export interface CreateSeatStatusDto {
  tripId: string;
  seatId: string;
  state: SeatState;
  bookingId?: string;
  lockedUntil?: string;
}

export interface UpdateSeatStatusDto {
  state?: SeatState;
  bookingId?: string;
  lockedUntil?: string;
}

class SeatStatusService {
  private readonly baseUrl = "/seat-status";

  /**
   * Get seat status by seat ID
   * @param seatId - ID of the seat
   * @returns Array of seat statuses
   */
  async findBySeatId(seatId: string): Promise<SeatStatus[]> {
    const response = await api.get(`${this.baseUrl}/seat/${seatId}`);
    return response.data;
  }

  /**
   * Get seat status by seat ID and trip ID
   * @param seatId - ID of the seat
   * @param tripId - ID of the trip
   * @returns Seat status
   */
  async findBySeatIdAndTripId(
    seatId: string,
    tripId: string,
  ): Promise<SeatStatus> {
    const response = await api.get(
      `${this.baseUrl}/seat/${seatId}/trip/${tripId}`,
    );
    return response.data;
  }

  /**
   * Get all seat statuses for a trip
   * @param tripId - ID of the trip
   * @returns Array of seat statuses
   */
  async findByTripId(tripId: string): Promise<SeatStatus[]> {
    const response = await api.get(`${this.baseUrl}/trip/${tripId}`);
    return response.data;
  }

  /**
   * Create a new seat status
   * @param data - Seat status data to create
   * @returns Created seat status
   */
  async create(data: CreateSeatStatusDto): Promise<SeatStatus> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update seat status
   * @param id - ID of the seat status to update
   * @param data - Data to update
   * @returns Updated seat status
   */
  async update(id: string, data: UpdateSeatStatusDto): Promise<SeatStatus> {
    const response = await api.patch(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete seat status
   * @param id - ID of the seat status to delete
   */
  async remove(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get available seats for a trip
   * @param tripId - ID of the trip
   * @returns Array of available seat statuses
   */
  async getAvailableSeats(tripId: string): Promise<SeatStatus[]> {
    const response = await api.get(`${this.baseUrl}/trip/${tripId}/available`);
    return response.data;
  }

  /**
   * Get booked seats for a trip
   * @param tripId - ID of the trip
   * @returns Array of booked seat statuses
   */
  async getBookedSeats(tripId: string): Promise<SeatStatus[]> {
    const response = await api.get(`${this.baseUrl}/trip/${tripId}/booked`);
    return response.data;
  }

  /**
   * Get locked seats for a trip
   * @param tripId - ID of the trip
   * @returns Array of locked seat statuses
   */
  async getLockedSeats(tripId: string): Promise<SeatStatus[]> {
    const response = await api.get(`${this.baseUrl}/trip/${tripId}/locked`);
    return response.data;
  }

  /**
   * Lock a seat for a trip
   * @param seatId - ID of the seat
   * @param tripId - ID of the trip
   * @param lockDurationMinutes - How long to lock the seat (default: 5 minutes)
   * @returns Updated seat status
   */
  async lockSeat(
    seatId: string,
    tripId: string,
    lockDurationMinutes: number = 5,
  ): Promise<SeatStatus> {
    const lockedUntil = new Date(
      Date.now() + lockDurationMinutes * 60 * 1000,
    ).toISOString();

    const response = await api.post(`${this.baseUrl}/lock`, {
      seatId,
      tripId,
      lockedUntil,
    });
    return response.data;
  }

  /**
   * Unlock a seat for a trip
   * @param seatId - ID of the seat
   * @param tripId - ID of the trip
   * @returns Updated seat status
   */
  async unlockSeat(seatId: string, tripId: string): Promise<SeatStatus> {
    const response = await api.post(`${this.baseUrl}/unlock`, {
      seatId,
      tripId,
    });
    return response.data;
  }

  /**
   * Refresh seat lock (extend lock duration)
   * @param seatId - ID of the seat
   * @param tripId - ID of the trip
   * @param lockDurationMinutes - How long to extend the lock (default: 5 minutes)
   * @returns Updated seat status
   */
  async refreshLock(
    seatId: string,
    tripId: string,
    lockDurationMinutes: number = 5,
  ): Promise<SeatStatus> {
    const lockedUntil = new Date(
      Date.now() + lockDurationMinutes * 60 * 1000,
    ).toISOString();

    const response = await api.post(`${this.baseUrl}/refresh-lock`, {
      seatId,
      tripId,
      lockedUntil,
    });
    return response.data;
  }
}

export const seatStatusService = new SeatStatusService();
export default seatStatusService;
