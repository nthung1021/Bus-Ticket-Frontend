import api from "@/lib/api";

export interface Route {
  id: string;
  operatorId: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedMinutes: number;
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
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedMinutes: number;
}

export interface UpdateRouteDto {
  operatorId?: string;
  origin?: string;
  destination?: string;
  distanceKm?: number;
  estimatedMinutes?: number;
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
