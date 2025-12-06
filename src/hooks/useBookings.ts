"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import UserBookingService, { type Booking, type BookingStatus } from "@/services/userBookingService";

interface UseBookingsOptions {
  autoFetch?: boolean;
  initialStatus?: BookingStatus;
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { autoFetch = true, initialStatus } = options;
  const router = useRouter();
  const { data: user, isLoading: authLoading, error: authError } = useCurrentUser();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchStatus, setLastFetchStatus] = useState<BookingStatus | undefined>(initialStatus);

  const bookingService = new UserBookingService();

  const fetchBookings = useCallback(async (status?: BookingStatus) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      setLastFetchStatus(status);
      
      const data = await bookingService.getUserBookings(status);
      setBookings(data);
      
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load bookings';
      setError(errorMessage);
      
      // If authentication error, redirect to login
      if (error instanceof Error && (error.message.includes('Authentication') || error.message.includes('Unauthorized'))) {
        // Store the intended destination to redirect back after login
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        router.push('/login?message=Please log in to view your bookings');
        return;
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, router, bookingService]);

  const refreshBookings = useCallback(async () => {
    return await fetchBookings(lastFetchStatus);
  }, [fetchBookings, lastFetchStatus]);

  const getBookingById = useCallback(async (bookingId: string) => {
    if (!user) return null;
    
    try {
      return await bookingService.getBookingById(bookingId);
    } catch (error) {
      console.error('Error fetching booking by ID:', error);
      return null;
    }
  }, [user, bookingService]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    if (!user) return false;
    
    try {
      await bookingService.cancelBooking(bookingId);
      // Refresh bookings after successful cancellation
      await refreshBookings();
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }, [user, bookingService, refreshBookings]);

  // Auto-fetch on user/auth change
  useEffect(() => {
    if (!autoFetch) return;
    
    // If auth is still loading, wait
    if (authLoading) return;
    
    // If there's an auth error (like 401), redirect to login
    if (authError) {
      console.log('Authentication error, redirecting to login:', authError);
      // Store the intended destination to redirect back after login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      }
      router.push('/login?message=Please log in to view your bookings');
      return;
    }
    
    // If auth is complete and we have a user, fetch bookings
    if (user) {
      fetchBookings(initialStatus);
    }
  }, [user, authLoading, authError, router, autoFetch, initialStatus, fetchBookings]);

  // Utility functions
  const getStatusColor = useCallback((status: string) => {
    return UserBookingService.getStatusColor(status as BookingStatus);
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    return UserBookingService.getStatusLabel(status as BookingStatus);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }, []);

  const isBookingExpired = useCallback((booking: Booking) => {
    return UserBookingService.isBookingExpired(booking);
  }, []);

  const canCancelBooking = useCallback((booking: Booking) => {
    return UserBookingService.canCancelBooking(booking);
  }, []);

  const canPayBooking = useCallback((booking: Booking) => {
    return UserBookingService.canPayBooking(booking);
  }, []);

  return {
    // Data
    bookings,
    user,
    
    // Loading states
    loading,
    authLoading,
    isInitialLoading: authLoading || (loading && bookings.length === 0),
    
    // Error states  
    error,
    authError,
    
    // Actions
    fetchBookings,
    refreshBookings,
    getBookingById,
    cancelBooking,
    
    // Utilities
    getStatusColor,
    getStatusLabel, 
    formatCurrency,
    isBookingExpired,
    canCancelBooking,
    canPayBooking,
  };
}