"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from "react";

/**
 * Interface for the seat context state and methods
 */
export interface SeatContextType {
  /** A Set of seat IDs that are currently locked by any user for the current trip. */
  lockedSeats: Set<string>;
  /** A Set of seat IDs that are currently booked for the current trip. */
  bookedSeats: Set<string>;
  /** Updates the locked seats state */
  setLockedSeats: (seats: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  /** Updates the booked seats state */
  setBookedSeats: (seats: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  /** Adds a seat to the locked seats */
  addLockedSeat: (seatId: string) => void;
  /** Removes a seat from the locked seats */
  removeLockedSeat: (seatId: string) => void;
  /** Adds a seat to the booked seats */
  addBookedSeat: (seatId: string) => void;
  /** Removes a seat from the booked seats */
  removeBookedSeat: (seatId: string) => void;
  /** Clears all seat states */
  clearAllSeats: () => void;
}

/**
 * Create the seat context with default values
 */
const SeatContext = createContext<SeatContextType | undefined>(undefined);

/**
 * Props for the SeatProvider component
 */
interface SeatProviderProps {
  children: ReactNode;
}

/**
 * SeatProvider component that provides seat state management to its children
 */
export function SeatProvider({ children }: SeatProviderProps) {
  const [lockedSeats, setLockedSeats] = useState<Set<string>>(new Set());
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());

  const addLockedSeat = useCallback((seatId: string) => {
    setLockedSeats((prev) => {
      const newSet = new Set(prev);
      newSet.add(seatId);
      return newSet;
    });
  }, []);

  const removeLockedSeat = useCallback((seatId: string) => {
    console.log("Removing locked seat");
    setLockedSeats((prev) => {
      const newSet = new Set(prev);
      newSet.delete(seatId);
      return newSet;
    });
  }, []);

  const addBookedSeat = useCallback((seatId: string) => {
    console.log("adding booked seat:", seatId);
    setBookedSeats((prev) => {
      const newSet = new Set(prev);
      newSet.add(seatId);
      console.log("New booked seats in callback:", Array.from(newSet));
      return newSet;
    });
  }, []);

  const removeBookedSeat = useCallback((seatId: string) => {
    setBookedSeats((prev) => {
      const newSet = new Set(prev);
      newSet.delete(seatId);
      return newSet;
    });
  }, []);

  const clearAllSeats = useCallback(() => {
    setLockedSeats(new Set());
    setBookedSeats(new Set());
  }, []);

  const value: SeatContextType = useMemo(() => ({
    lockedSeats,
    bookedSeats,
    setLockedSeats,
    setBookedSeats,
    addLockedSeat,
    removeLockedSeat,
    addBookedSeat,
    removeBookedSeat,
    clearAllSeats,
  }), [
    lockedSeats,
    bookedSeats,
    addLockedSeat,
    removeLockedSeat,
    addBookedSeat,
    removeBookedSeat,
    clearAllSeats,
  ]);

  return <SeatContext.Provider value={value}>{children}</SeatContext.Provider>;
}

/**
 * Custom hook to use the seat context
 * @throws Error if used outside of SeatProvider
 */
export function useSeatContext(): SeatContextType {
  const context = useContext(SeatContext);
  if (context === undefined) {
    throw new Error("useSeatContext must be used within a SeatProvider");
  }
  return context;
}
