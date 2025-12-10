"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  seatWebSocketService,
  SeatStatusEvent,
  SeatLock,
} from "@/services/seat-websocket.service";
import { seatStatusService } from "@/services/seat-status.service";
import { useSeatContext } from "@/contexts/seat-context";

/**
 * Options for the useSeatWebSocket hook.
 */
interface UseSeatWebSocketOptions {
  /** The ID of the trip to connect to. */
  tripId: string;
  /**
   * Whether the WebSocket connection should be enabled.
   * Defaults to true.
   */
  enabled?: boolean;
}

/**
 * Return value of the useSeatWebSocket hook.
 */
interface UseSeatWebSocketReturn {
  /** True if the WebSocket is currently connected to the server. */
  isConnected: boolean;
  /** A Set of seat IDs that are currently locked by any user for the given trip. */
  lockedSeats: Set<string>;
  /** A Set of seat IDs that are currently booked for the given trip. */
  bookedSeats: Set<string>;
  /**
   * Attempts to lock a specific seat.
   * @param seatId The ID of the seat to lock.
   * @param userId Optional user ID to associate with the lock (if different from current user).
   * @returns A Promise that resolves to true if the seat was successfully locked, false otherwise.
   */
  lockSeat: (seatId: string, userId?: string) => Promise<boolean>;
  /**
   * Attempts to unlock a specific seat that was previously locked by the current user.
   * @param seatId The ID of the seat to unlock.
   * @returns A Promise that resolves to true if the seat was successfully unlocked, false otherwise.
   */
  unlockSeat: (seatId: string) => Promise<boolean>;
  /**
   * Refreshes the lock on a specific seat, extending its expiration time.
   * This is typically used to keep a lock active if a user is still interacting with a seat.
   * @param seatId The ID of the seat to refresh the lock for.
   * @returns A Promise that resolves to true if the lock was successfully refreshed, false otherwise.
   */
  refreshLock: (seatId: string) => Promise<boolean>;
  /**
   * Checks if a seat is currently locked by another user.
   * @param seatId The ID of the seat to check.
   * @returns True if the seat is locked by someone else, false otherwise.
   */
  isSeatLockedByOthers: (seatId: string) => boolean;
  /**
   * Checks if a seat is currently locked by the current user.
   * @param seatId The ID of the seat to check.
   * @returns True if the seat is locked by the current user, false otherwise.
   */
  isSeatLockedByMe: (seatId: string) => boolean;
  /**
   * Attempts to book a specific seat.
   * @param seatId The ID of the seat to book.
   * @param bookingId Optional booking ID to associate with the booking.
   * @returns A Promise that resolves to true if the seat was successfully booked, false otherwise.
   */
  bookSeat: (seatId: string, bookingId?: string) => Promise<boolean>;
  /**
   * Attempts to unbook a specific seat.
   * @param seatId The ID of the seat to unbook.
   * @returns A Promise that resolves to true if the seat was successfully unbooked, false otherwise.
   */
  unbookSeat: (seatId: string) => Promise<boolean>;
  /**
   * Unlocks all seats locked by the current user.
   * This is useful when the component unmounts or the dialog closes.
   * @returns A Promise that resolves when all seats are unlocked.
   */
  unlockAllMySeats: () => Promise<void>;
}

/**
 * A custom React hook for managing real-time seat locking/unlocking functionality
 * for a specific bus trip using WebSockets.
 *
 * This hook handles WebSocket connection, joining/leaving a trip,
 * receiving real-time updates on seat statuses, and providing functions
 * to lock, unlock, and refresh seat locks.
 *
 * @param {UseSeatWebSocketOptions} { tripId, enabled } - Options for the hook.
 * @returns {UseSeatWebSocketReturn} An object containing connection status,
 * currently locked seats, and functions for seat management.
 */
export function useSeatWebSocket({
  tripId,
  enabled = true,
}: UseSeatWebSocketOptions): UseSeatWebSocketReturn {
  /**
   * State to track the WebSocket connection status.
   */
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Use seat context for managing seat states
   */
  const {
    lockedSeats,
    bookedSeats,
    setLockedSeats,
    setBookedSeats,
    addLockedSeat,
    removeLockedSeat,
    addBookedSeat,
    removeBookedSeat,
  } = useSeatContext();

  /**
   * A ref to store seat IDs that the current user has successfully locked.
   * Using a ref prevents unnecessary re-renders when only `myLocksRef` changes.
   */
  const myLocksRef = useRef<Set<string>>(new Set());
  /**
   * A ref to track if the client has successfully joined the specified trip
   * on the WebSocket server.
   */
  const hasJoinedRef = useRef(false);

  // Event handlers

  /**
   * Callback function to handle `seatLocked` events from the WebSocket server.
   * Adds the locked seat ID to the `lockedSeats` state if it belongs to the current trip.
   * @param data The SeatStatusEvent containing trip and seat ID.
   */
  const handleSeatLocked = useCallback(
    (data: SeatStatusEvent) => {
      if (data.tripId === tripId) {
        addLockedSeat(data.seatId);
      }
    },
    [tripId, addLockedSeat],
  );

  /**
   * Callback function to handle `seatUnlocked` events from the WebSocket server.
   * Removes the unlocked seat ID from the `lockedSeats` state and `myLocksRef`
   * if it belongs to the current trip.
   * @param data The SeatStatusEvent containing trip and seat ID.
   */
  const handleSeatUnlocked = useCallback(
    (data: SeatStatusEvent) => {
      if (data.tripId === tripId) {
        removeLockedSeat(data.seatId);
        myLocksRef.current.delete(data.seatId);
      }
    },
    [tripId, removeLockedSeat],
  );

  /**
   * Callback function to handle `seatBooked` events from the WebSocket server.
   * Removes the booked seat ID from the `lockedSeats` state and `myLocksRef`
   * if it belongs to the current trip. Booked seats are no longer considered merely 'locked'.
   * Also adds the booked seat ID to the `bookedSeats` state.
   * @param data The SeatStatusEvent containing trip and seat ID.
   */
  const handleSeatBooked = useCallback(
    (data: SeatStatusEvent) => {
      if (data.tripId === tripId) {
        removeLockedSeat(data.seatId);
        myLocksRef.current.delete(data.seatId);
        addBookedSeat(data.seatId);
      }
    },
    [tripId, removeLockedSeat, addBookedSeat],
  );

  /**
   * Callback function to handle `seatAvailable` events from the WebSocket server.
   * Removes the available seat ID from the `bookedSeats` state if it belongs to the current trip.
   * @param data The SeatStatusEvent containing trip and seat ID.
   */
  const handleSeatAvailable = useCallback(
    (data: SeatStatusEvent) => {
      if (data.tripId === tripId) {
        removeBookedSeat(data.seatId);
      }
    },
    [tripId, removeBookedSeat],
  );

  /**
   * Callback function to handle `currentLocks` events. This event provides
   * an initial list of all currently locked seats for the joined trip.
   * @param data An object containing the tripId and an array of SeatLock objects.
   */
  const handleCurrentLocks = useCallback(
    (data: { tripId: string; lockedSeats: SeatLock[] }) => {
      if (data.tripId === tripId) {
        const seatIds = new Set(data.lockedSeats.map((lock) => lock.seatId));
        setLockedSeats(seatIds);
      }
    },
    [tripId, setLockedSeats],
  );

  /**
   * Effect hook to manage the WebSocket connection lifecycle.
   * Connects to the WebSocket service when enabled and handles global connect/disconnect events.
   */
  useEffect(() => {
    if (!enabled) return;

    const socket = seatWebSocketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      hasJoinedRef.current = false; // Reset join status on disconnect
      console.log("WebSocket disconnected");
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
  }, [enabled]); // Re-run effect if 'enabled' status changes

  /**
   * Effect hook to load initial locked seats and booked seats from database.
   * This runs when the component is enabled and has a tripId.
   */
  useEffect(() => {
    if (!enabled || !tripId) return;

    const loadSeatsFromDatabase = async () => {
      try {
        // Load locked seats
        const lockedSeatsData = await seatStatusService.getLockedSeats(tripId);
        const lockedSeatIds = new Set(
          lockedSeatsData.map((seat) => seat.seatId),
        );
        setLockedSeats(lockedSeatIds);
        console.log(
          `Loaded ${lockedSeatIds.size} locked seats from database for trip ${tripId}`,
        );

        // Load booked seats
        const bookedSeatsData = await seatStatusService.getBookedSeats(tripId);
        const bookedSeatIds = new Set(
          bookedSeatsData.map((seat) => seat.seatId),
        );
        setBookedSeats(bookedSeatIds);
        console.log(
          `Loaded ${bookedSeatIds.size} booked seats from database for trip ${tripId}`,
        );
      } catch (error) {
        console.error("Failed to load seats from database:", error);
        // Continue with empty seats if database query fails
      }
    };

    loadSeatsFromDatabase();
  }, [enabled, tripId, setLockedSeats, setBookedSeats]);

  /**
   * Effect hook to join a specific trip and set up trip-specific event listeners.
   * This runs when the component is enabled, connected, has a tripId, and hasn't joined yet.
   */
  useEffect(() => {
    // Only proceed if enabled, connected, a tripId is provided, and we haven't joined already.
    if (!enabled || !isConnected || !tripId || hasJoinedRef.current) return;

    const joinTripAndSetupListeners = async () => {
      try {
        await seatWebSocketService.joinTrip(tripId);
        hasJoinedRef.current = true; // Mark as joined

        // Set up event listeners for seat status updates specific to this trip
        seatWebSocketService.onSeatLocked(handleSeatLocked);
        seatWebSocketService.onSeatUnlocked(handleSeatUnlocked);
        seatWebSocketService.onSeatBooked(handleSeatBooked);
        seatWebSocketService.onSeatAvailable(handleSeatAvailable);
        seatWebSocketService.onCurrentLocks(handleCurrentLocks);

        console.log(`Joined trip ${tripId}`);
      } catch (error) {
        console.error("Failed to join trip:", error);
      }
    };

    joinTripAndSetupListeners();

    // Cleanup function: leave the trip and remove trip-specific event listeners
    return () => {
      if (hasJoinedRef.current) {
        seatWebSocketService.leaveTrip(tripId).catch(console.error);
        hasJoinedRef.current = false; // Mark as not joined

        // Clean up event listeners to prevent memory leaks and incorrect state updates
        seatWebSocketService.offSeatLocked(handleSeatLocked);
        seatWebSocketService.offSeatUnlocked(handleSeatUnlocked);
        seatWebSocketService.offSeatBooked(handleSeatBooked);
        seatWebSocketService.offSeatAvailable(handleSeatAvailable);
        seatWebSocketService.offCurrentLocks(handleCurrentLocks);

        console.log(`Left trip ${tripId}`);
      }
    };
  }, [
    enabled,
    isConnected,
    tripId,
    handleSeatLocked,
    handleSeatUnlocked,
    handleSeatBooked,
    handleSeatAvailable,
    handleCurrentLocks,
  ]); // Dependencies include all event handlers to ensure they are up-to-date

  /**
   * Locks a specific seat on the server.
   * If successful, the seat ID is added to `myLocksRef`.
   * @param seatId The ID of the seat to lock.
   * @param userId Optional user ID.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const lockSeat = useCallback(
    async (seatId: string, userId?: string): Promise<boolean> => {
      try {
        const response = await seatWebSocketService.lockSeat(
          tripId,
          seatId,
          userId,
        );
        if (response.success) {
          myLocksRef.current.add(seatId); // Track seats locked by this client
          addLockedSeat(seatId);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to lock seat:", error);
        return false;
      }
    },
    [tripId, addLockedSeat],
  );

  /**
   * Unlocks a specific seat on the server.
   * If successful, the seat ID is removed from `myLocksRef`.
   * @param seatId The ID of the seat to unlock.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const unlockSeat = useCallback(
    async (seatId: string): Promise<boolean> => {
      try {
        const response = await seatWebSocketService.unlockSeat(tripId, seatId);
        if (response.success) {
          myLocksRef.current.delete(seatId); // Remove from client's locked seats
          removeLockedSeat(seatId);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to unlock seat:", error);
        return false;
      }
    },
    [tripId, removeLockedSeat],
  );

  /**
   * Checks if a given seat is currently locked by any user *other than* the current client.
   * @param seatId The ID of the seat to check.
   * @returns True if the seat is locked by others, false otherwise.
   */
  const isSeatLockedByOthers = useCallback(
    (seatId: string): boolean => {
      // A seat is locked by others if it's in the global `lockedSeats` set
      // but not in the `myLocksRef` set (i.e., not locked by this client).
      return lockedSeats.has(seatId) && !myLocksRef.current.has(seatId);
    },
    [lockedSeats], // Depends on `lockedSeats` state
  );

  /**
   * Checks if a given seat is currently locked by the current client.
   * @param seatId The ID of the seat to check.
   * @returns True if the seat is locked by the current client, false otherwise.
   */
  const isSeatLockedByMe = useCallback((seatId: string): boolean => {
    // A seat is locked by me if it's present in the `myLocksRef` set.
    return myLocksRef.current.has(seatId);
  }, []); // No dependencies as `myLocksRef.current` is stable

  /**
   * Books a specific seat on the server.
   * Uses WebSocket to book a seat that must be locked by the current user.
   * @param seatId The ID of the seat to book.
   * @param bookingId Optional booking ID to associate with the booking.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const bookSeat = useCallback(
    async (seatId: string, bookingId?: string): Promise<boolean> => {
      try {
        console.log("bookSeat called with:", seatId);

        // First, check if seat is locked by current user
        if (!isSeatLockedByMe(seatId)) {
          console.log(
            "Seat is not locked by current user, attempting to lock first...",
          );
          const lockSuccess = await lockSeat(seatId);
          if (!lockSuccess) {
            console.error("Failed to lock seat before booking");
            return false;
          }
          console.log("Seat locked successfully, proceeding with booking...");
        }

        const response = await seatWebSocketService.bookSeat(
          tripId,
          seatId,
          bookingId,
        );
        console.log("bookSeat response:", response);
        if (response.success) {
          console.log("Calling addBookedSeat for:", seatId);
          addBookedSeat(seatId);
        }
        return response.success;
      } catch (error) {
        console.error("Failed to book seat:", error);
        return false;
      }
    },
    [tripId, addBookedSeat, isSeatLockedByMe, lockSeat],
  );

  /**
   * Unbooks a specific seat on the server.
   * Uses WebSocket to cancel a booked seat, making it available again.
   * @param seatId The ID of the seat to unbook.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const unbookSeat = useCallback(
    async (seatId: string): Promise<boolean> => {
      try {
        const response = await seatWebSocketService.cancelSeat(tripId, seatId);
        removeBookedSeat(seatId);
        return response.success;
      } catch (error) {
        console.error("Failed to unbook seat:", error);
        return false;
      }
    },
    [tripId, removeBookedSeat],
  );

  /**
   * Refreshes the lock for a specific seat on the server.
   * This extends the lock's expiration time.
   * @param seatId The ID of the seat to refresh the lock for.
   * @returns A Promise resolving to true if successful, false otherwise.
   */
  const refreshLock = useCallback(
    async (seatId: string): Promise<boolean> => {
      try {
        const response = await seatWebSocketService.refreshLock(tripId, seatId);
        return response.success;
      } catch (error) {
        console.error("Failed to refresh lock:", error);
        return false;
      }
    },
    [tripId],
  );

  /**
   * Unlocks all seats locked by the current user.
   * This is useful when the component unmounts or dialog closes.
   * @returns A Promise that resolves when all seats are unlocked.
   */
  const unlockAllMySeats = useCallback(async (): Promise<void> => {
    const myLockedSeats = Array.from(myLocksRef.current);

    if (myLockedSeats.length === 0) return;

    console.log(`Unlocking ${myLockedSeats.length} seats for cleanup`);

    // Unlock all seats in parallel
    await Promise.allSettled(myLockedSeats.map((seatId) => unlockSeat(seatId)));

    // Clear the ref
    myLocksRef.current.clear();
  }, [unlockSeat]);

  /**
   * Effect hook to cleanup locks when the component unmounts.
   * This ensures all locks are released when the user leaves the page or closes dialog.
   */
  useEffect(() => {
    // Return cleanup function that runs when component unmounts
    return () => {
      // console.log("Calling unlockAllMySeats")
      unlockAllMySeats();
    };
  }, [unlockAllMySeats]);

  return {
    isConnected,
    lockedSeats,
    bookedSeats,
    lockSeat,
    unlockSeat,
    refreshLock,
    bookSeat,
    unbookSeat,
    isSeatLockedByOthers,
    isSeatLockedByMe,
    unlockAllMySeats,
  };
}
