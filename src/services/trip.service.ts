import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// Configure axios to include credentials for CORS
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types matching backend entities
export enum PointType {
  PICKUP = "pickup",
  DROPOFF = "dropoff",
  BOTH = "both",
}

export enum TripStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DELAYED = "delayed",
}

export interface Route {
  id: string;
  operatorId: string;
  name: string;
  description: string;
  isActive: boolean;
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
  points: RoutePoint[];
  operator?: Operator;
  trips?: Trip[];
}

export interface RoutePoint {
  id: string;
  routeId: string;
  name: string;
  latitude: number;
  longitude: number;
  type: PointType;
  order: number;
  distanceFromStart?: number;
  estimatedTimeFromStart?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Operator {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  approvedAt?: Date;
  buses?: Bus[];
  routes?: Route[];
}

export interface Bus {
  id: string;
  operatorId: string;
  plateNumber: string;
  model: string;
  seatCapacity: number;
  amenities: string[];
}

export interface Trip {
  id: string;
  routeId: string;
  busId: string;
  departureTime: Date;
  arrivalTime: Date;
  basePrice: number;
  status: TripStatus;
  route?: Route;
  bus?: Bus;
}

export interface CreateTripDto {
  routeId: string;
  busId: string;
  departureTime: string; // ISO string
  arrivalTime: string; // ISO string
  basePrice: number;
  status?: TripStatus;
}

export interface UpdateTripDto {
  routeId?: string;
  busId?: string;
  departureTime?: string;
  arrivalTime?: string;
  basePrice?: number;
  status?: TripStatus;
}

// Trip API calls
export const getTrips = async (): Promise<Trip[]> => {
  try {
    const response = await apiClient.get("/trips");
    return response.data;
  } catch (error) {
    console.error("Error fetching trips:", error);
    throw error;
  }
};

export const getTripById = async (id: string): Promise<Trip> => {
  try {
    const response = await apiClient.get(`/trips/admin/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching trip:", error);
    throw error;
  }
};

export const createTrip = async (tripData: CreateTripDto): Promise<Trip> => {
  try {
    const response = await apiClient.post("/trips", tripData);
    return response.data;
  } catch (error) {
    console.error("Error creating trip:", error);
    throw error;
  }
};

export const updateTrip = async (
  id: string,
  tripData: UpdateTripDto,
): Promise<Trip> => {
  try {
    const response = await apiClient.put(`/trips/${id}`, tripData);
    return response.data;
  } catch (error) {
    console.error("Error updating trip:", error);
    throw error;
  }
};

export const deleteTrip = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/trips/${id}`);
  } catch (error) {
    console.error("Error deleting trip:", error);
    throw error;
  }
};

// Routes API calls
export const getRoutes = async (): Promise<Route[]> => {
  try {
    const response = await apiClient.get("/routes");
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching routes:", error);
    throw error;
  }
};

// Buses API calls
export const getBuses = async (): Promise<Bus[]> => {
  try {
    const response = await apiClient.get("/buses");
    return response.data;
  } catch (error) {
    console.error("Error fetching buses:", error);
    throw error;
  }
};

// Helper function to format date for backend
export const formatDateForBackend = (date: Date): string => {
  const isoString = new Date(date).toISOString();
  // Try without milliseconds if needed
  return isoString.split(".")[0] + "Z";
};

// Helper function to format date from backend for display
export const formatDateFromBackend = (dateString: string): Date => {
  return new Date(dateString);
};
