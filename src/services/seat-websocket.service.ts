import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
  "http://localhost:3000";

export interface SeatLock {
  seatId: string;
  userId: string;
  expiresAt: Date;
}

export interface SeatStatusEvent {
  tripId: string;
  seatId: string;
  userId?: string;
  expiresAt?: Date;
}

export interface JoinTripResponse {
  success: boolean;
  tripId: string;
}

export interface LeaveTripResponse {
  success: boolean;
  tripId: string;
}

export interface LockSeatResponse {
  success: boolean;
  lock?: SeatLock;
  message?: string;
}

export interface UnlockSeatResponse {
  success: boolean;
  message?: string;
}

export interface RefreshLockResponse {
  success: boolean;
  expiresAt?: Date;
  message?: string;
}

export interface BookSeatResponse {
  success: boolean;
  seatId?: string;
  userId?: string;
  message?: string;
}

export interface BookSeatsResponse {
  success: boolean;
  bookedSeats?: string[];
  failedSeats?: Array<{ seatId: string; reason: string }>;
}

export interface CancelSeatResponse {
  success: boolean;
  seatId?: string;
  message?: string;
}

class SeatWebSocketService {
  private socket: Socket | null = null;
  private currentTripId: string | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(`${SOCKET_URL}/seats`, {
        transports: ["websocket", "polling"],
        withCredentials: true,
      });

      this.socket.on("connect", () => {
        console.log("WebSocket connected");
      });

      this.socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      if (this.currentTripId) {
        this.leaveTrip(this.currentTripId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentTripId = null;
    }
  }

  joinTrip(tripId: string): Promise<{ success: boolean; tripId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.currentTripId = tripId;
      this.socket.emit("joinTrip", { tripId }, (response: JoinTripResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error("Failed to join trip"));
        }
      });
    });
  }

  leaveTrip(tripId: string): Promise<{ success: boolean; tripId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "leaveTrip",
        { tripId },
        (response: LeaveTripResponse) => {
          if (response.success) {
            this.currentTripId = null;
            resolve(response);
          } else {
            reject(new Error("Failed to leave trip"));
          }
        },
      );
    });
  }

  lockSeat(
    tripId: string,
    seatId: string,
    userId?: string,
  ): Promise<{ success: boolean; lock?: SeatLock; message?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "lockSeat",
        { tripId, seatId, userId },
        (response: LockSeatResponse) => {
          resolve(response);
        },
      );
    });
  }

  unlockSeat(
    tripId: string,
    seatId: string,
  ): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "unlockSeat",
        { tripId, seatId },
        (response: UnlockSeatResponse) => {
          resolve(response);
        },
      );
    });
  }

  refreshLock(
    tripId: string,
    seatId: string,
  ): Promise<{ success: boolean; expiresAt?: Date; message?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "refreshLock",
        { tripId, seatId },
        (response: RefreshLockResponse) => {
          resolve(response);
        },
      );
    });
  }

  bookSeat(
    tripId: string,
    seatId: string,
    userId?: string,
  ): Promise<{
    success: boolean;
    seatId?: string;
    userId?: string;
    message?: string;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "bookSeat",
        { tripId, seatId, userId },
        (response: BookSeatResponse) => {
          resolve(response);
        },
      );
    });
  }

  bookSeats(
    tripId: string,
    seatIds: string[],
    userId?: string,
  ): Promise<{
    success: boolean;
    bookedSeats?: string[];
    failedSeats?: Array<{ seatId: string; reason: string }>;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "bookSeats",
        { tripId, seatIds, userId },
        (response: BookSeatsResponse) => {
          resolve(response);
        },
      );
    });
  }

  cancelSeat(
    tripId: string,
    seatId: string,
    userId?: string,
  ): Promise<{ success: boolean; seatId?: string; message?: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "cancelSeat",
        { tripId, seatId, userId },
        (response: CancelSeatResponse) => {
          resolve(response);
        },
      );
    });
  }

  onSeatLocked(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.on("seatLocked", callback);
    }
  }

  onSeatUnlocked(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.on("seatUnlocked", callback);
    }
  }

  onSeatBooked(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.on("seatBooked", callback);
    }
  }

  onSeatAvailable(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.on("seatAvailable", callback);
    }
  }

  onCurrentLocks(
    callback: (data: { tripId: string; lockedSeats: SeatLock[] }) => void,
  ) {
    if (this.socket) {
      this.socket.on("currentLocks", callback);
    }
  }

  offSeatLocked(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.off("seatLocked", callback);
    }
  }

  offSeatUnlocked(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.off("seatUnlocked", callback);
    }
  }

  offSeatBooked(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.off("seatBooked", callback);
    }
  }

  offSeatAvailable(callback: (data: SeatStatusEvent) => void) {
    if (this.socket) {
      this.socket.off("seatAvailable", callback);
    }
  }

  offCurrentLocks(
    callback: (data: { tripId: string; lockedSeats: SeatLock[] }) => void,
  ) {
    if (this.socket) {
      this.socket.off("currentLocks", callback);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const seatWebSocketService = new SeatWebSocketService();
