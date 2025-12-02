import api from "@/lib/api";

export interface RoutePoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: "pickup" | "dropoff" | "both";
  order: number;
  distanceFromStart?: number;
  estimatedTimeFromStart?: number;
  routeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  operatorId: string;
  name: string;
  description: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedMinutes: number;
  isActive: boolean;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
  points?: RoutePoint[];
  operator?: {
    id: string;
    name: string;
  };
  trips?: Array<{
    id: string;
    departureTime: string;
    arrivalTime: string;
  }>;
}

export interface CreateRouteDto {
  operatorId: string;
  name: string;
  description: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  estimatedMinutes?: number;
  amenities?: string[];
  points?: Omit<RoutePoint, "id" | "routeId" | "createdAt" | "updatedAt">[];
}

export interface UpdateRouteDto {
  operatorId?: string;
  name?: string;
  description?: string;
  origin?: string;
  destination?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
  amenities?: string[];
  isActive?: boolean;
  points?: Omit<RoutePoint, "id" | "routeId" | "createdAt" | "updatedAt">[];
}

export const routeService = {
  getAll: async (): Promise<Route[]> => {
    const response = await api.get("/routes");
    return response.data;
  },

  getById: async (id: string): Promise<Route> => {
    const response = await api.get(`/routes/${id}`);
    return response.data;
  },

  create: async (data: CreateRouteDto): Promise<Route> => {
    const response = await api.post("/routes", data);
    return response.data;
  },

  update: async (id: string, data: UpdateRouteDto): Promise<Route> => {
    const response = await api.put(`/routes/${id}`, data);
    console.log(response);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/routes/${id}`);
  },

  findByOperator: async (operatorId: string): Promise<Route[]> => {
    const response = await api.get(`/routes?operatorId=${operatorId}`);
    return response.data;
  },
};
