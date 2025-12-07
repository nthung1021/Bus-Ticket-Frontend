import api from "../lib/api";

export enum SeatLayoutType {
  STANDARD_2X2 = "standard_2x2",
  STANDARD_2X3 = "standard_2x3",
  VIP_1X2 = "vip_1x2",
  SLEEPER_1X2 = "sleeper_1x2",
  CUSTOM = "custom",
}

export interface SeatPosition {
  row: number;
  position: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SeatInfo {
  id: string;
  code: string;
  type: "normal" | "vip" | "business";
  position: SeatPosition;
  isAvailable: boolean;
  price?: number;
}

export interface LayoutDimensions {
  totalWidth: number;
  totalHeight: number;
  seatWidth: number;
  seatHeight: number;
  aisleWidth: number;
  rowSpacing: number;
}

export interface SeatLayoutConfig {
  seats: SeatInfo[];
  aisles: number[];
  dimensions: LayoutDimensions;
}

export interface SeatTypePrices {
  normal: number;
  vip: number;
  business: number;
}

export interface SeatPricingConfig {
  basePrice: number;
  seatTypePrices: SeatTypePrices;
  rowPricing?: { [rowNumber: number]: number };
  positionPricing?: { [position: string]: number };
}

export interface SeatLayout {
  id: string;
  busId: string;
  layoutType: SeatLayoutType;
  totalRows: number;
  seatsPerRow: number;
  layoutConfig: SeatLayoutConfig;
  seatPricing: SeatPricingConfig;
  createdAt: string;
  updatedAt: string;
  bus?: {
    id: string;
    plateNumber: string;
    model: string;
    seatCapacity: number;
  };
}

export interface CreateSeatLayoutDto {
  busId: string;
  layoutType: SeatLayoutType;
  totalRows: number;
  seatsPerRow: number;
  layoutConfig: SeatLayoutConfig;
  seatPricing: SeatPricingConfig;
}

export interface CreateSeatFromTemplateDto {
  busId: string;
  layoutType: SeatLayoutType;
  seatPricing: SeatPricingConfig;
}

export interface UpdateSeatLayoutDto {
  layoutType?: SeatLayoutType;
  totalRows?: number;
  seatsPerRow?: number;
  layoutConfig?: SeatLayoutConfig;
  seatPricing?: SeatPricingConfig;
}

export interface LayoutTemplate {
  type: SeatLayoutType;
  name: string;
  description: string;
  totalSeats: number;
  preview: string;
}

export interface TemplatesResponse {
  templates: LayoutTemplate[];
}

class SeatLayoutService {
  async getAll(): Promise<SeatLayout[]> {
    const response = await api.get("/seat-layouts");
    return response.data;
  }

  async getById(id: string): Promise<SeatLayout> {
    const response = await api.get(`/seat-layouts/${id}`);
    return response.data;
  }

  async getByBusId(busId: string): Promise<SeatLayout> {
    const response = await api.get(`/seat-layouts/bus/${busId}`);
    return response.data;
  }

  async create(data: CreateSeatLayoutDto): Promise<SeatLayout> {
    const response = await api.post("/seat-layouts", data);
    return response.data;
  }

  async createFromTemplate(
    data: CreateSeatFromTemplateDto,
  ): Promise<SeatLayout> {
    const response = await api.post("/seat-layouts/from-template", data);
    return response.data;
  }

  async update(id: string, data: UpdateSeatLayoutDto): Promise<SeatLayout> {
    try {
      const response = await api.patch(`/seat-layouts/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating seat layout ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/seat-layouts/${id}`);
  }

  async getTemplates(): Promise<TemplatesResponse> {
    const response = await api.get("/seat-layouts/templates");
    return response.data;
  }

  async getTemplateConfig(type: SeatLayoutType): Promise<{
    totalRows: number;
    seatsPerRow: number;
    layoutConfig: SeatLayoutConfig;
  }> {
    const response = await api.get(`/seat-layouts/template/${type}`);
    return response.data;
  }
}

export const seatLayoutService = new SeatLayoutService();
