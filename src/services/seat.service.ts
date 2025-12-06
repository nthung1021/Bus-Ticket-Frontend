import api from "@/lib/api";

export interface Seat {
  id: string;
  seatCode: string;
  seatType: string;
  isActive: boolean;
  busId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSeatDto {
  seatCode: string;
  seatType: string;
  isActive?: boolean;
  busId: string;
}

export interface UpdateSeatDto {
  seatCode?: string;
  seatType?: string;
  isActive?: boolean;
}

export interface SeatType {
  type: string;
  name: string;
  price: number;
  color: string;
}

class SeatService {
  private readonly baseUrl = "/seats";

  /**
   * Get all seats for a specific bus
   * @param busId - ID of the bus
   * @returns Array of seats
   */
  async findByBusId(busId: string): Promise<Seat[]> {
    const response = await api.get(`${this.baseUrl}/bus/${busId}`);
    return response.data;
  }

  /**
   * Get seat by ID
   * @param id - ID of the seat
   * @returns Seat details
   */
  async findById(id: string): Promise<Seat> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Get seat by seat code and bus ID
   * @param seatCode - Seat code (e.g., "A1", "B2")
   * @param busId - ID of the bus
   * @returns Seat details
   */
  async findBySeatCode(seatCode: string, busId: string): Promise<Seat> {
    const response = await api.get(
      `${this.baseUrl}/code/${seatCode}/bus/${busId}`,
    );
    return response.data;
  }

  /**
   * Create a new seat
   * @param data - Seat data to create
   * @returns Created seat
   */
  async create(data: CreateSeatDto): Promise<Seat> {
    const response = await api.post(this.baseUrl, data);
    return response.data;
  }

  /**
   * Update seat information
   * @param id - ID of the seat to update
   * @param data - Data to update
   * @returns Updated seat
   */
  async update(id: string, data: UpdateSeatDto): Promise<Seat> {
    const response = await api.patch(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a seat
   * @param id - ID of the seat to delete
   */
  async remove(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Get active seats for a bus
   * @param busId - ID of the bus
   * @returns Array of active seats
   */
  async getActiveSeats(busId: string): Promise<Seat[]> {
    const response = await api.get(`${this.baseUrl}/bus/${busId}/active`);
    return response.data;
  }

  /**
   * Get inactive seats for a bus
   * @param busId - ID of the bus
   * @returns Array of inactive seats
   */
  async getInactiveSeats(busId: string): Promise<Seat[]> {
    const response = await api.get(`${this.baseUrl}/bus/${busId}/inactive`);
    return response.data;
  }

  /**
   * Get seats by type for a bus
   * @param busId - ID of the bus
   * @param seatType - Type of seat (e.g., "VIP", "STANDARD", "ECONOMY")
   * @returns Array of seats of specified type
   */
  async getSeatsByType(busId: string, seatType: string): Promise<Seat[]> {
    const response = await api.get(
      `${this.baseUrl}/bus/${busId}/type/${seatType}`,
    );
    return response.data;
  }

  /**
   * Bulk create seats for a bus
   * @param seats - Array of seat data to create
   * @returns Array of created seats
   */
  async bulkCreate(seats: CreateSeatDto[]): Promise<Seat[]> {
    const response = await api.post(`${this.baseUrl}/bulk`, seats);
    return response.data;
  }

  /**
   * Bulk update seats
   * @param updates - Array of { id, data } objects
   * @returns Array of updated seats
   */
  async bulkUpdate(
    updates: { id: string; data: UpdateSeatDto }[],
  ): Promise<Seat[]> {
    const response = await api.patch(`${this.baseUrl}/bulk`, updates);
    return response.data;
  }

  /**
   * Bulk delete seats
   * @param ids - Array of seat IDs to delete
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await api.delete(`${this.baseUrl}/bulk`, { data: { ids } });
  }

  /**
   * Activate/deactivate seat
   * @param id - ID of the seat
   * @param isActive - Whether to activate or deactivate
   * @returns Updated seat
   */
  async toggleActive(id: string, isActive: boolean): Promise<Seat> {
    const response = await api.patch(`${this.baseUrl}/${id}/toggle`, {
      isActive,
    });
    return response.data;
  }

  /**
   * Get seat statistics for a bus
   * @param busId - ID of the bus
   * @returns Seat statistics object
   */
  async getSeatStats(busId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }> {
    const response = await api.get(`${this.baseUrl}/bus/${busId}/stats`);
    return response.data;
  }

  /**
   * Validate seat code format
   * @param seatCode - Seat code to validate
   * @returns True if valid, false otherwise
   */
  validateSeatCode(seatCode: string): boolean {
    // Seat code should be like "A1", "B2", "C3" etc.
    return /^[A-Z]\d+$/.test(seatCode);
  }

  /**
   * Generate next seat code for a bus
   * @param busId - ID of the bus
   * @param seatType - Type of seat
   * @returns Next available seat code
   */
  async generateNextSeatCode(busId: string, seatType: string): Promise<string> {
    const response = await api.get(
      `${this.baseUrl}/bus/${busId}/next-code/${seatType}`,
    );
    return response.data.nextCode;
  }
}

export const seatService = new SeatService();
export default seatService;
