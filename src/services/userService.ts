import api from "@/lib/api";

export interface UserProfileData {
  userId: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
}

class UserService {
  async getProfile(): Promise<UserProfileData> {
    const response = await api.get("/users/profile");
    return response.data.data;
  }

  async updateProfile(data: UpdateProfileDto): Promise<UserProfileData> {
    const response = await api.put("/users/profile", data);
    return response.data.data;
  }
}

const userService = new UserService();
export default userService;
