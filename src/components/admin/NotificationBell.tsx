'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from '@/lib/utils';
import notificationService, { Notification } from '@/services/notification.service';

interface NotificationBellProps {
  onSearchBooking?: (bookingReference: string) => void;
}

export const NotificationBell = ({ onSearchBooking }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications({ limit: 10 });
      setNotifications(data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (notification.isRead === false) {
      await handleMarkAsRead(notification.id);
    }

    // Close dropdown
    setIsOpen(false);

    // Search for booking if it's a booking-related notification
    if (
      (notification.type === 'booking_cancellation' || 
       notification.type === 'cancellation_request' || 
       notification.data?.type === 'booking_cancellation' ||
       notification.data?.type === 'cancellation_request') && 
      notification.data?.bookingReference && 
      onSearchBooking
    ) {
      onSearchBooking(notification.data.bookingReference);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string, data?: any) => {
    const notificationType = data?.type || type;
    switch (notificationType) {
      case 'booking_cancellation':
        return '🚌'; // Bus emoji for completed cancellation
      case 'cancellation_request':
        return '⚠️'; // Warning emoji for pending request
      case 'payment_refund':
        return '💰'; // Money emoji for refund
      case 'booking_created':
        return '✅'; // Checkmark for new booking
      default:
        return '📢'; // Default notification icon
    }
  };

  const getNotificationTypeLabel = (type: string, data?: any) => {
    const notificationType = data?.type || type;
    switch (notificationType) {
      case 'booking_cancellation':
        return 'Booking Cancelled';
      case 'cancellation_request':
        return 'Cancellation Request';
      case 'payment_refund':
        return 'Payment Refund';
      case 'booking_created':
        return 'New Booking';
      default:
        return 'Notification';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start space-x-3 px-4 py-3 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="text-lg flex-shrink-0">
                  {getNotificationIcon(notification.type, notification.data)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {getNotificationTypeLabel(notification.type, notification.data)}
                    </p>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            
            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};