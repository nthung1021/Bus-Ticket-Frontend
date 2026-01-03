import api from "@/lib/api";

export interface UserProfileData {
  userId: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  createdAt: string;
  authProvider: string;
  avatarUrl?: string;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

  async changePassword(data: ChangePasswordDto): Promise<void> {
    await api.post("/users/change-password", data);
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  }
}

const userService = new UserService();
export default userService;
