import api from "@/lib/api";

export interface UserProfileData {
  userId: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  createdAt: string;
}

class UserService {
  async getProfile(): Promise<UserProfileData> {
    const response = await api.get("/users/profile");
    return response.data.data;
  }
}

const userService = new UserService();
export default userService;
