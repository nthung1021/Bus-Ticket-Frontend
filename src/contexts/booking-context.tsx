"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  BookingStatus,
  PaymentUpdate,
  BookingInfo,
} from "@/services/booking-websocket.service";

/**
 * Interface for the booking context state and methods
 */
interface BookingContextType {
  // State
  bookings: Map<string, BookingInfo>;
  payments: Map<string, PaymentUpdate>;
  trackedBookings: Set<string>;

  // Booking management methods
  setBookings: React.Dispatch<React.SetStateAction<Map<string, BookingInfo>>>;
  setPayments: React.Dispatch<React.SetStateAction<Map<string, PaymentUpdate>>>;
  setTrackedBookings: React.Dispatch<React.SetStateAction<Set<string>>>;

  // Utility methods
  addBooking: (bookingId: string, bookingInfo: BookingInfo) => void;
  updateBooking: (bookingId: string, updates: Partial<BookingInfo>) => void;
  removeBooking: (bookingId: string) => void;
  addPayment: (bookingId: string, paymentUpdate: PaymentUpdate) => void;
  updatePayment: (bookingId: string, updates: Partial<PaymentUpdate>) => void;
  removePayment: (bookingId: string) => void;
  addTrackedBooking: (bookingId: string) => void;
  removeTrackedBooking: (bookingId: string) => void;
  clearAllBookings: () => void;
  clearAllPayments: () => void;
  clearAllTrackedBookings: () => void;

  // Getters
  getBooking: (bookingId: string) => BookingInfo | undefined;
  getPayment: (bookingId: string) => PaymentUpdate | undefined;
  isBookingTracked: (bookingId: string) => boolean;
  getBookingStatus: (bookingId: string) => BookingStatus | undefined;
  getPaymentStatus: (bookingId: string) => PaymentUpdate | undefined;

  // Derived state
  getBookingsByStatus: (status: BookingStatus) => BookingInfo[];
  getPendingBookings: () => BookingInfo[];
  getPaidBookings: () => BookingInfo[];
  getCancelledBookings: () => BookingInfo[];
  getPendingPayments: () => PaymentUpdate[];
  getCompletedPayments: () => PaymentUpdate[];
}

/**
 * Create the booking context with default values
 */
const BookingContext = createContext<BookingContextType | undefined>(undefined);

/**
 * Props for the BookingProvider component
 */
interface BookingProviderProps {
  children: ReactNode;
}

/**
 * BookingProvider component that provides booking state management
 * to all child components
 */
export function BookingProvider({ children }: BookingProviderProps) {
  // State management
  const [bookings, setBookings] = useState<Map<string, BookingInfo>>(new Map());
  const [payments, setPayments] = useState<Map<string, PaymentUpdate>>(
    new Map()
  );
  const [trackedBookings, setTrackedBookings] = useState<Set<string>>(
    new Set()
  );

  // Booking management methods
  const addBooking = useCallback(
    (bookingId: string, bookingInfo: BookingInfo) => {
      setBookings((prev) => new Map(prev).set(bookingId, bookingInfo));
    },
    []
  );

  const updateBooking = useCallback(
    (bookingId: string, updates: Partial<BookingInfo>) => {
      setBookings((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(bookingId);
        if (existing) {
          newMap.set(bookingId, { ...existing, ...updates });
        }
        return newMap;
      });
    },
    []
  );

  const removeBooking = useCallback((bookingId: string) => {
    setBookings((prev) => {
      const newMap = new Map(prev);
      newMap.delete(bookingId);
      return newMap;
    });
  }, []);

  // Payment management methods
  const addPayment = useCallback(
    (bookingId: string, paymentUpdate: PaymentUpdate) => {
      setPayments((prev) => new Map(prev).set(bookingId, paymentUpdate));
    },
    []
  );

  const updatePayment = useCallback(
    (bookingId: string, updates: Partial<PaymentUpdate>) => {
      setPayments((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(bookingId);
        if (existing) {
          newMap.set(bookingId, { ...existing, ...updates });
        }
        return newMap;
      });
    },
    []
  );

  const removePayment = useCallback((bookingId: string) => {
    setPayments((prev) => {
      const newMap = new Map(prev);
      newMap.delete(bookingId);
      return newMap;
    });
  }, []);

  // Tracked booking management methods
  const addTrackedBooking = useCallback((bookingId: string) => {
    setTrackedBookings((prev) => new Set(prev).add(bookingId));
  }, []);

  const removeTrackedBooking = useCallback((bookingId: string) => {
    setTrackedBookings((prev) => {
      const newSet = new Set(prev);
      newSet.delete(bookingId);
      return newSet;
    });
  }, []);

  // Clear methods
  const clearAllBookings = useCallback(() => {
    setBookings(new Map());
  }, []);

  const clearAllPayments = useCallback(() => {
    setPayments(new Map());
  }, []);

  const clearAllTrackedBookings = useCallback(() => {
    setTrackedBookings(new Set());
  }, []);

  // Getter methods
  const getBooking = useCallback(
    (bookingId: string): BookingInfo | undefined => {
      return bookings.get(bookingId);
    },
    [bookings]
  );

  const getPayment = useCallback(
    (bookingId: string): PaymentUpdate | undefined => {
      return payments.get(bookingId);
    },
    [payments]
  );

  const isBookingTracked = useCallback(
    (bookingId: string): boolean => {
      return trackedBookings.has(bookingId);
    },
    [trackedBookings]
  );

  const getBookingStatus = useCallback(
    (bookingId: string): BookingStatus | undefined => {
      return bookings.get(bookingId)?.status;
    },
    [bookings]
  );

  const getPaymentStatus = useCallback(
    (bookingId: string): PaymentUpdate | undefined => {
      return payments.get(bookingId);
    },
    [payments]
  );

  // Derived state methods
  const getBookingsByStatus = useCallback(
    (status: BookingStatus): BookingInfo[] => {
      return Array.from(bookings.values()).filter(
        (booking) => booking.status === status
      );
    },
    [bookings]
  );

  const getPendingBookings = useCallback((): BookingInfo[] => {
    return getBookingsByStatus(BookingStatus.PENDING);
  }, [getBookingsByStatus]);

  const getPaidBookings = useCallback((): BookingInfo[] => {
    return getBookingsByStatus(BookingStatus.PAID);
  }, [getBookingsByStatus]);

  const getCancelledBookings = useCallback((): BookingInfo[] => {
    return getBookingsByStatus(BookingStatus.CANCELLED);
  }, [getBookingsByStatus]);

  const getPendingPayments = useCallback((): PaymentUpdate[] => {
    return Array.from(payments.values()).filter(
      (payment) => payment.paymentStatus === "pending"
    );
  }, [payments]);

  const getCompletedPayments = useCallback((): PaymentUpdate[] => {
    return Array.from(payments.values()).filter(
      (payment) => payment.paymentStatus === "completed"
    );
  }, [payments]);

  // Context value
  const value: BookingContextType = {
    // State
    bookings,
    payments,
    trackedBookings,

    // Setters
    setBookings,
    setPayments,
    setTrackedBookings,

    // Booking management
    addBooking,
    updateBooking,
    removeBooking,

    // Payment management
    addPayment,
    updatePayment,
    removePayment,

    // Tracked booking management
    addTrackedBooking,
    removeTrackedBooking,

    // Clear methods
    clearAllBookings,
    clearAllPayments,
    clearAllTrackedBookings,

    // Getters
    getBooking,
    getPayment,
    isBookingTracked,
    getBookingStatus,
    getPaymentStatus,

    // Derived state
    getBookingsByStatus,
    getPendingBookings,
    getPaidBookings,
    getCancelledBookings,
    getPendingPayments,
    getCompletedPayments,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

/**
 * Custom hook to use the booking context
 * Throws an error if used outside of a BookingProvider
 */
export function useBookingContext(): BookingContextType {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBookingContext must be used within a BookingProvider");
  }
  return context;
}

/**
 * Custom hook to safely use the booking context
 * Returns undefined if used outside of a BookingProvider instead of throwing an error
 */
export function useBookingContextSafe(): BookingContextType | undefined {
  return useContext(BookingContext);
}
