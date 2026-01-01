import api from "@/lib/api";

export interface CreateAccountDto {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: string;
}

export const adminService = {
  createAccount: async (data: CreateAccountDto) => {
    const response = await api.post("/admin/account", data);
    return response.data;
  },
};
