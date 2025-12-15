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
  getAll: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    origin?: string;
    destination?: string;
    isActive?: boolean;
  }): Promise<{ routes: Route[]; total: number; totalPages: number; currentPage: number }> => {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.origin) searchParams.append('origin', params.origin);
    if (params?.destination) searchParams.append('destination', params.destination);
    if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());
    
    const response = await api.get(`/routes${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  },

  getAllSimple: async (): Promise<Route[]> => {
    const response = await api.get("/routes");
    return Array.isArray(response.data) ? response.data : response.data.routes || [];
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
