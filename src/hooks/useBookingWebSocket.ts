"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  bookingWebSocketService,
  BookingStatus,
  BookingStatusEvent,
  PaymentUpdate,
  BookingInfo,
  BookingCreatedEvent,
  BookingCancelledEvent,
} from "@/services/booking-websocket.service";
import { useBookingContext } from "@/contexts/booking-context";

/**
 * Options for the useBookingWebSocket hook.
 */
interface UseBookingWebSocketOptions {
  /** The ID of the trip to connect to. */
  tripId: string;
  /**
   * Whether the WebSocket connection should be enabled.
   * Defaults to true.
   */
  enabled?: boolean;
  /** Optional user ID for tracking bookings */
  userId?: string;
}

/**
 * Return value of the useBookingWebSocket hook.
 */
interface UseBookingWebSocketReturn {
  /** True if the WebSocket is currently connected to the server. */
  isConnected: boolean;
  /** Map of all bookings with their detailed information */
  bookings: Map<string, BookingInfo>;
  /** Set of currently tracked booking IDs */
  trackedBookings: Set<string>;
  /**
   * Attempts to track a specific booking for real-time updates.
   * @param bookingId The ID of the booking to track.
   * @returns A Promise that resolves to true if the booking was successfully tracked, false otherwise.
   */
  trackBooking: (bookingId: string) => Promise<boolean>;
  /**
   * Attempts to stop tracking a specific booking.
   * @param bookingId The ID of the booking to stop tracking.
   * @returns A Promise that resolves to true if the booking was successfully untracked, false otherwise.
   */
  untrackBooking: (bookingId: string) => Promise<boolean>;
  /**
   * Updates the status of a specific booking.
   * @param bookingId The ID of the booking to update.
   * @param status The new booking status.
   * @param metadata Optional metadata about the status change.
   * @returns A Promise that resolves to true if the status was successfully updated, false otherwise.
   */
  updateBookingStatus: (
    bookingId: string,
    status: BookingStatus,
    metadata?: Record<string, unknown>,
  ) => Promise<boolean>;
  /**
   * Updates the payment status of a specific booking.
   * @param bookingId The ID of the booking to update.
   * @param paymentStatus The new payment status.
   * @param amount Optional payment amount.
   * @param paymentMethod Optional payment method.
   * @param transactionId Optional transaction ID.
   * @returns A Promise that resolves to true if the payment status was successfully updated, false otherwise.
   */
  updatePaymentStatus: (
    bookingId: string,
    paymentStatus: "pending" | "completed" | "failed" | "refunded",
    amount?: number,
    paymentMethod?: string,
    transactionId?: string,
  ) => Promise<boolean>;
  /**
   * Checks if a specific booking is currently being tracked.
   * @param bookingId The ID of the booking to check.
   * @returns True if the booking is being tracked, false otherwise.
   */
  isTrackingBooking: (bookingId: string) => boolean;
  /**
   * Gets the current status of a specific booking.
   * @param bookingId The ID of the booking to check.
   * @returns The booking status or undefined if the booking is not found.
   */
  getBookingStatus: (bookingId: string) => BookingStatus | undefined;
  /**
   * Gets the payment status of a specific booking.
   * @param bookingId The ID of the booking to check.
   * @returns The payment update or undefined if not found.
   */
  getPaymentStatus: (bookingId: string) => PaymentUpdate | undefined;
  /**
   * Stops tracking all bookings.
   * This is useful when the component unmounts.
   * @returns A Promise that resolves when all bookings are untracked.
   */
  untrackAllBookings: () => Promise<void>;
}

/**
 * A custom React hook for managing real-time booking status functionality
 * for a specific bus trip using WebSockets.
 *
 * This hook handles WebSocket connection, joining/leaving a trip,
 * receiving real-time updates on booking statuses, and providing functions
 * to track bookings and update their status.
 *
 * @param {UseBookingWebSocketOptions} { tripId, enabled, userId } - Options for the hook.
 * @returns {UseBookingWebSocketReturn} An object containing connection status,
 * current bookings, payment information, and functions for booking management.
 */
export function useBookingWebSocket({
  tripId,
  enabled = true,
  userId,
}: UseBookingWebSocketOptions): UseBookingWebSocketReturn {
  /**
   * State to track the WebSocket connection status.
   */
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Use booking context for managing booking states
   */
  const {
    bookings,
    trackedBookings,
    addBooking,
    updateBooking,
    addPayment,
    addTrackedBooking,
    removeTrackedBooking,
    clearAllTrackedBookings,
    isBookingTracked,
    getBookingStatus,
    getPaymentStatus,
  } = useBookingContext();

  /**
   * A ref to track if the client has successfully joined the specified trip
   * on the WebSocket server.
   */
  const hasJoinedRef = useRef(false);

  // Event handlers

  /**
   * Callback function to handle `bookingCreated` events from the WebSocket server.
   * Adds the new booking to the bookings state if it belongs to the current trip.
   * @param data The BookingCreatedEvent containing booking information.
   */
  const handleBookingCreated = useCallback(
    (data: BookingCreatedEvent) => {
      if (data.tripId === tripId) {
        const bookingInfo: BookingInfo = {
          bookingId: data.bookingId,
          bookingReference: data.bookingReference,
          userId: data.userId,
          totalAmount: data.totalAmount,
          status: data.status,
          bookedAt: data.bookedAt,
        };

        addBooking(data.bookingId, bookingInfo);
        console.log(`Booking created: ${data.bookingId} for trip ${tripId}`);
      }
    },
    [tripId, addBooking],
  );

  /**
   * Callback function to handle `bookingStatusUpdated` events from the WebSocket server.
   * Updates the booking status in the bookings state if it belongs to the current trip.
   * @param data The BookingStatusEvent containing booking status information.
   */
  const handleBookingStatusUpdated = useCallback(
    (data: BookingStatusEvent) => {
      if (data.tripId === tripId) {
        updateBooking(data.bookingId, { status: data.status });
        console.log(
          `Booking ${data.bookingId} status updated to ${data.status}`,
        );
      }
    },
    [tripId, updateBooking],
  );

  /**
   * Callback function to handle `paymentStatusUpdated` events from the WebSocket server.
   * Updates the payment information in the payments state if it belongs to the current trip.
   * @param data The PaymentUpdate containing payment information.
   */
  const handlePaymentStatusUpdated = useCallback(
    (data: PaymentUpdate) => {
      if (data.tripId === tripId) {
        addPayment(data.bookingId, data);
        console.log(
          `Payment status updated for booking ${data.bookingId}: ${data.paymentStatus}`,
        );
      }
    },
    [tripId, addPayment],
  );

  /**
   * Callback function to handle `bookingCancelled` events from the WebSocket server.
   * Updates the booking status to CANCELLED if it belongs to the current trip.
   * @param data The BookingCancelledEvent containing cancellation information.
   */
  const handleBookingCancelled = useCallback(
    (data: BookingCancelledEvent) => {
      if (data.tripId === tripId) {
        updateBooking(data.bookingId, { status: data.status });
        console.log(`Booking ${data.bookingId} cancelled for trip ${tripId}`);
      }
    },
    [tripId, updateBooking],
  );

  /**
   * Callback function to handle `currentBookings` events. This event provides
   * an initial list of all currently active bookings for the joined trip.
   * @param data An object containing the tripId and an array of BookingInfo objects.
   */
  const handleCurrentBookings = useCallback(
    (data: { tripId: string; bookings: BookingInfo[] }) => {
      if (data.tripId === tripId) {
        data.bookings.forEach((booking) => {
          addBooking(booking.bookingId, booking);
        });
        console.log(
          `Loaded ${data.bookings.length} bookings for trip ${tripId}`,
        );
      }
    },
    [tripId, addBooking],
  );

  /**
   * Callback function to handle `bookingStatus` events for individual bookings being tracked.
   * @param data The booking status information.
   */
  const handleBookingStatus = useCallback(
    (data: {
      bookingId: string;
      tripId: string;
      status: BookingStatus;
      totalAmount: number;
      bookedAt: Date;
    }) => {
      if (data.tripId === tripId) {
        const bookingInfo: BookingInfo = {
          bookingId: data.bookingId,
          bookingReference: "", // Will be filled by other events
          userId: userId,
          totalAmount: data.totalAmount,
          status: data.status,
          bookedAt: data.bookedAt,
        };

        addBooking(data.bookingId, bookingInfo);
        console.log(
          `Received booking status for ${data.bookingId}: ${data.status}`,
        );
      }
    },
    [tripId, userId, addBooking],
  );

  /**
   * Effect hook to manage the WebSocket connection lifecycle.
   * Connects to the WebSocket service when enabled and handles global connect/disconnect events.
   */
  useEffect(() => {
    if (!enabled) return;

    const socket = bookingWebSocketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      console.log("Booking WebSocket connected");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      hasJoinedRef.current = false; // Reset join status on disconnect
      clearAllTrackedBookings(); // Clear tracked bookings using context
      console.log("Booking WebSocket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // If the socket is already connected when the effect runs, manually set isConnected
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup function: remove global event listeners when the component unmounts or dependencies change.
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [enabled, clearAllTrackedBookings]); // Re-run effect if 'enabled' status changes

  /**
   * Effect hook to join a specific trip and set up trip-specific event listeners.
   * This runs when the component is enabled, connected, has a tripId, and hasn't joined yet.
   */
  useEffect(() => {
    // Only proceed if enabled, connected, a tripId is provided, and we haven't joined already.
    if (!enabled || !isConnected || !tripId || hasJoinedRef.current) return;

    const joinTripAndSetupListeners = async () => {
      try {
        await bookingWebSocketService.joinTrip(tripId, userId);
        hasJoinedRef.current = true; // Mark as joined

        // Set up event listeners for booking status updates specific to this trip
        bookingWebSocketService.onBookingCreated(handleBookingCreated);
        bookingWebSocketService.onBookingStatusUpdated(
          handleBookingStatusUpdated,
        );
        bookingWebSocketService.onPaymentStatusUpdated(
          handlePaymentStatusUpdated,
        );
        bookingWebSocketService.onBookingCancelled(handleBookingCancelled);
        bookingWebSocketService.onCurrentBookings(handleCurrentBookings);
        bookingWebSocketService.onBookingStatus(handleBookingStatus);

        console.log(`Joined trip ${tripId} for booking tracking`);
      } catch (error) {
        console.error("Failed to join trip for booking tracking:", error);
      }
    };

    joinTripAndSetupListeners();

    // Cleanup function: leave the trip and remove trip-specific event listeners
    return () => {
      if (hasJoinedRef.current) {
        bookingWebSocketService.leaveTrip(tripId).catch(console.error);
        hasJoinedRef.current = false; // Mark as not joined

        // Clean up event listeners to prevent memory leaks and incorrect state updates
        bookingWebSocketService.offBookingCreated(handleBookingCreated);
        bookingWebSocketService.offBookingStatusUpdated(
          handleBookingStatusUpdated,
        );
        bookingWebSocketService.offPaymentStatusUpdated(
          handlePaymentStatusUpdated,
        );
        bookingWebSocketService.offBookingCancelled(handleBookingCancelled);
        bookingWebSocketService.offCurrentBookings(handleCurrentBookings);
        bookingWebSocketService.offBookingStatus(handleBookingStatus);

        console.log(`Left trip ${tripId} for booking tracking`);
      }
    };
  }, [
    enabled,
    isConnected,
    tripId,
    userId,
    handleBookingCreated,
    handleBookingStatusUpdated,
    handlePaymentStatusUpdated,
    handleBookingCancelled,
    handleCurrentBookings,
    handleBookingStatus,
  ]); // Dependencies include all event handlers to ensure they are up-to-date

  /**
   * Tracks a specific booking for real-time updates.
   * @param bookingId The ID of the booking to track.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const trackBooking = useCallback(
    async (bookingId: string): Promise<boolean> => {
      try {
        const response = await bookingWebSocketService.trackBooking(
          bookingId,
          userId,
        );
        if (response.success) {
          addTrackedBooking(bookingId);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to track booking:", error);
        return false;
      }
    },
    [userId, addTrackedBooking],
  );

  /**
   * Stops tracking a specific booking.
   * @param bookingId The ID of the booking to stop tracking.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const untrackBooking = useCallback(
    async (bookingId: string): Promise<boolean> => {
      try {
        const response = await bookingWebSocketService.untrackBooking(
          bookingId,
          userId,
        );
        if (response.success) {
          removeTrackedBooking(bookingId);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to untrack booking:", error);
        return false;
      }
    },
    [userId, removeTrackedBooking],
  );

  /**
   * Updates the status of a specific booking.
   * @param bookingId The ID of the booking to update.
   * @param status The new booking status.
   * @param metadata Optional metadata about the status change.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const updateBookingStatus = useCallback(
    async (
      bookingId: string,
      status: BookingStatus,
      metadata?: Record<string, unknown>,
    ): Promise<boolean> => {
      try {
        const response = await bookingWebSocketService.updateBookingStatus(
          bookingId,
          status,
          userId,
          metadata,
        );
        return response.success;
      } catch (error) {
        console.error("Failed to update booking status:", error);
        return false;
      }
    },
    [userId],
  );

  /**
   * Updates the payment status of a specific booking.
   * @param bookingId The ID of the booking to update.
   * @param paymentStatus The new payment status.
   * @param amount Optional payment amount.
   * @param paymentMethod Optional payment method.
   * @param transactionId Optional transaction ID.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const updatePaymentStatus = useCallback(
    async (
      bookingId: string,
      paymentStatus: "pending" | "completed" | "failed" | "refunded",
      amount?: number,
      paymentMethod?: string,
      transactionId?: string,
    ): Promise<boolean> => {
      try {
        const response = await bookingWebSocketService.updatePaymentStatus(
          bookingId,
          paymentStatus,
          amount,
          paymentMethod,
          transactionId,
          userId,
        );
        return response.success;
      } catch (error) {
        console.error("Failed to update payment status:", error);
        return false;
      }
    },
    [userId],
  );

  /**
   * Checks if a specific booking is currently being tracked.
   * @param bookingId The ID of the booking to check.
   * @returns True if the booking is being tracked, false otherwise.
   */
  const isTrackingBooking = useCallback(
    (bookingId: string): boolean => {
      return isBookingTracked(bookingId);
    },
    [isBookingTracked],
  );

  /**
   * Gets the current status of a specific booking.
   * @param bookingId The ID of the booking to check.
   * @returns The booking status or undefined if the booking is not found.
   */
  const getBookingStatusFromContext = useCallback(
    (bookingId: string): BookingStatus | undefined => {
      return getBookingStatus(bookingId);
    },
    [getBookingStatus],
  );

  /**
   * Gets the payment status of a specific booking.
   * @param bookingId The ID of the booking to check.
   * @returns The payment update or undefined if not found.
   */
  const getPaymentStatusFromContext = useCallback(
    (bookingId: string): PaymentUpdate | undefined => {
      return getPaymentStatus(bookingId);
    },
    [getPaymentStatus],
  );

  /**
   * Stops tracking all bookings.
   * This is useful when the component unmounts.
   * @returns A Promise that resolves when all bookings are untracked.
   */
  const untrackAllBookings = useCallback(async (): Promise<void> => {
    const bookingIds = Array.from(trackedBookings);

    if (bookingIds.length === 0) return;

    console.log(`Untracking ${bookingIds.length} bookings for cleanup`);

    // Untrack all bookings in parallel
    await Promise.allSettled(
      bookingIds.map((bookingId) => untrackBooking(bookingId)),
    );

    // Clear the tracked bookings set directly since we're using context
    // This will be handled by the context's state management
  }, [trackedBookings, untrackBooking]);

  return {
    isConnected,
    bookings,
    trackedBookings,
    trackBooking,
    untrackBooking,
    updateBookingStatus,
    updatePaymentStatus,
    isTrackingBooking,
    getBookingStatus: getBookingStatusFromContext,
    getPaymentStatus: getPaymentStatusFromContext,
    untrackAllBookings,
  };
}
