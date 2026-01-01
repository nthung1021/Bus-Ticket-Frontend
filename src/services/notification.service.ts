import api from "@/lib/api";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "booking" | "system" | "promotion" | "reminder";
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional: link to a booking or other resource if needed
  resourceId?: string;
  resourceType?: string;
}

class NotificationService {
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get<{ data: Notification[] }>(
        "/notifications",
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.put("/notifications/read-all");
    } catch (error) {
      console.error("Error marking all notification as read:", error);
      throw error;
    }
  }
}

export default new NotificationService();
