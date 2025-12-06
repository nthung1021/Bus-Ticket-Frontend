"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  seatWebSocketService,
  SeatStatusEvent,
  SeatLock,
} from "@/services/seat-websocket.service";

interface UseSeatWebSocketOptions {
  tripId: string;
  enabled?: boolean;
}

interface UseSeatWebSocketReturn {
  isConnected: boolean;
  lockedSeats: Set<string>;
  lockSeat: (seatId: string, userId?: string) => Promise<boolean>;
  unlockSeat: (seatId: string) => Promise<boolean>;
  refreshLock: (seatId: string) => Promise<boolean>;
  isSeatLockedByOthers: (seatId: string) => boolean;
  isSeatLockedByMe: (seatId: string) => boolean;
}

export function useSeatWebSocket({
  tripId,
  enabled = true,
}: UseSeatWebSocketOptions): UseSeatWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lockedSeats, setLockedSeats] = useState<Set<string>>(new Set());
  const myLocksRef = useRef<Set<string>>(new Set());
  const hasJoinedRef = useRef(false);

  // Event handlers
  const handleSeatLocked = useCallback(
    (data: SeatStatusEvent) => {
      if (data.tripId === tripId) {
        setLockedSeats((prev) => {
          const newSet = new Set(prev);
          newSet.add(data.seatId);
          return newSet;
        });
      }
    },
    [tripId],
  );

  const handleSeatUnlocked = useCallback(
    (data: SeatStatusEvent) => {
      if (data.tripId === tripId) {
        setLockedSeats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.seatId);
          return newSet;
        });
        myLocksRef.current.delete(data.seatId);
      }
    },
    [tripId],
  );

  const handleSeatBooked = useCallback(
    (data: SeatStatusEvent) => {
      if (data.tripId === tripId) {
        setLockedSeats((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.seatId);
          return newSet;
        });
        myLocksRef.current.delete(data.seatId);
      }
    },
    [tripId],
  );

  const handleCurrentLocks = useCallback(
    (data: { tripId: string; lockedSeats: SeatLock[] }) => {
      if (data.tripId === tripId) {
        const seatIds = new Set(data.lockedSeats.map((lock) => lock.seatId));
        setLockedSeats(seatIds);
      }
    },
    [tripId],
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled) return;

    const socket = seatWebSocketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      console.log("WebSocket connected");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      hasJoinedRef.current = false;
      console.log("WebSocket disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [enabled]);

  // Join trip and set up event listeners
  useEffect(() => {
    if (!enabled || !isConnected || !tripId || hasJoinedRef.current) return;

    const joinTripAndSetupListeners = async () => {
      try {
        await seatWebSocketService.joinTrip(tripId);
        hasJoinedRef.current = true;

        // Set up event listeners
        seatWebSocketService.onSeatLocked(handleSeatLocked);
        seatWebSocketService.onSeatUnlocked(handleSeatUnlocked);
        seatWebSocketService.onSeatBooked(handleSeatBooked);
        seatWebSocketService.onCurrentLocks(handleCurrentLocks);

        console.log(`Joined trip ${tripId}`);
      } catch (error) {
        console.error("Failed to join trip:", error);
      }
    };

    joinTripAndSetupListeners();

    return () => {
      if (hasJoinedRef.current) {
        seatWebSocketService.leaveTrip(tripId).catch(console.error);
        hasJoinedRef.current = false;

        // Clean up event listeners
        seatWebSocketService.offSeatLocked(handleSeatLocked);
        seatWebSocketService.offSeatUnlocked(handleSeatUnlocked);
        seatWebSocketService.offSeatBooked(handleSeatBooked);
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
    handleCurrentLocks,
  ]);

  // Lock a seat
  const lockSeat = useCallback(
    async (seatId: string, userId?: string): Promise<boolean> => {
      try {
        const response = await seatWebSocketService.lockSeat(
          tripId,
          seatId,
          userId,
        );
        if (response.success) {
          myLocksRef.current.add(seatId);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to lock seat:", error);
        return false;
      }
    },
    [tripId],
  );

  // Unlock a seat
  const unlockSeat = useCallback(
    async (seatId: string): Promise<boolean> => {
      try {
        const response = await seatWebSocketService.unlockSeat(tripId, seatId);
        if (response.success) {
          myLocksRef.current.delete(seatId);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to unlock seat:", error);
        return false;
      }
    },
    [tripId],
  );

  // Refresh a seat lock
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

  // Check if a seat is locked by others
  const isSeatLockedByOthers = useCallback(
    (seatId: string): boolean => {
      return lockedSeats.has(seatId) && !myLocksRef.current.has(seatId);
    },
    [lockedSeats],
  );

  // Check if a seat is locked by me
  const isSeatLockedByMe = useCallback((seatId: string): boolean => {
    return myLocksRef.current.has(seatId);
  }, []);

  return {
    isConnected,
    lockedSeats,
    lockSeat,
    unlockSeat,
    refreshLock,
    isSeatLockedByOthers,
    isSeatLockedByMe,
  };
}
