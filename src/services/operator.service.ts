import api from "@/lib/api";

export enum OperatorStatus {
  PENDING = "pending",
  APPROVED = "approved",
  SUSPENDED = "suspended",
}

export interface Operator {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  status: OperatorStatus;
  approvedAt?: string;
  buses?: Array<{
    id: string;
    plateNumber: string;
    model: string;
  }>;
  routes?: Array<{
    id: string;
    name: string;
  }>;
}

export interface CreateOperatorDto {
  name: string;
  contactEmail: string;
  contactPhone: string;
  status?: OperatorStatus;
}

export interface UpdateOperatorDto {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: OperatorStatus;
}

export const operatorService = {
  getAll: async (): Promise<Operator[]> => {
    const response = await api.get("/operators");
    return response.data;
  },

  getById: async (id: string): Promise<Operator> => {
    const response = await api.get(`/operators/${id}`);
    return response.data;
  },

  create: async (data: CreateOperatorDto): Promise<Operator> => {
    const response = await api.post("/operators", data);
    return response.data;
  },

  update: async (id: string, data: UpdateOperatorDto): Promise<Operator> => {
    const response = await api.put(`/operators/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/operators/${id}`);
  },

  approve: async (id: string): Promise<Operator> => {
    const response = await api.put(`/operators/${id}/approve`);
    return response.data;
  },

  suspend: async (id: string): Promise<Operator> => {
    const response = await api.put(`/operators/${id}/suspend`);
    return response.data;
  },

  findByStatus: async (status: OperatorStatus): Promise<Operator[]> => {
    const response = await api.get(`/operators/status/${status}`);
    return response.data;
  },
};
