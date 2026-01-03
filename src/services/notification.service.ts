import api from "@/lib/api";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  data?: any;
  // Optional: link to a booking or other resource if needed
  resourceId?: string;
  resourceType?: string;
}

class NotificationService {
  async getNotifications(params?: {
    status?: 'all' | 'unread' | 'read';
    page?: number;
    limit?: number;
  }): Promise<Notification[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== 'all') {
        queryParams.append('status', params.status);
      }
      if (params?.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const url = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<{ success: boolean; data: Notification[] }>(url);

      if (!response.data.success) {
        throw new Error('Failed to fetch notifications');
      }

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

  async getUnreadCount(): Promise<number> {
    try {
      const unreadNotifications = await this.getNotifications({ status: 'unread' });
      return unreadNotifications.length;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
}

export default new NotificationService();
