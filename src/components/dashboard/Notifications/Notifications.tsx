"use client";

import { useEffect, useState } from "react";
import { 
  Ticket, 
  Info, 
  AlertCircle, 
  Clock,
  Bell
} from "lucide-react";
import NotificationService, { Notification } from "@/services/notification.service";
import { format } from "date-fns";

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications();
      // Sort by date descending
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted);
    } catch (err) {
      setError("Failed to load notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      // Update local state to reflect change without refetching everything
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return <Ticket className="w-5 h-5 text-blue-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'promotion':
        return <Info className="w-5 h-5 text-purple-500" />;
      case 'system':
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <span className="text-sm text-gray-500">
          {notifications.filter(n => !n.isRead).length} unread
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
          <p className="text-gray-500 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                relative flex gap-4 p-4 rounded-lg transition-colors border
                ${notification.isRead 
                  ? 'bg-white border-gray-100' 
                  : 'bg-blue-50/50 border-blue-100'
                }
              `}
              onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
            >
              <div className="shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-900' : 'text-blue-900'}`}>
                    {notification.title}
                  </p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(notification.createdAt), 'PP p')}
                  </span>
                </div>
                
                <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-600' : 'text-blue-800'}`}>
                  {notification.message}
                </p>
              </div>

              {!notification.isRead && (
                <div className="shrink-0 self-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
