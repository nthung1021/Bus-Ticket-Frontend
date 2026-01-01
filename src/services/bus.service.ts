import api from "@/lib/api";

export interface Bus {
  id: string;
  operatorId: string;
  plateNumber: string;
  model: string;
  seatCapacity: number;
  amenities: string[];
  operator?: {
    id: string;
    name: string;
  };
  photo?: string[];
}

export interface CreateBusDto {
  operatorId: string;
  plateNumber: string;
  model: string;
  seatCapacity: number;
  amenities: string[];
}

export interface UpdateBusDto {
  operatorId?: string;
  plateNumber?: string;
  model?: string;
  seatCapacity?: number;
  amenities?: string[];
}

export const busService = {
  getAll: async (): Promise<Bus[]> => {
    const response = await api.get("/buses");
    return response.data;
  },

  getById: async (id: string): Promise<Bus> => {
    const response = await api.get(`/buses/${id}`);
    return response.data;
  },

  create: async (data: CreateBusDto): Promise<Bus> => {
    const response = await api.post("/buses", data);
    return response.data;
  },

  update: async (id: string, data: UpdateBusDto): Promise<Bus> => {
    const response = await api.put(`/buses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/buses/${id}`);
  },

  uploadPhotos: async (id: string, files: File[]): Promise<Bus> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post(`/buses/${id}/photos`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
