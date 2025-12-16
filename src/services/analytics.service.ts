import api from "@/lib/api";

// Admin Analytics Types (for backend integration)
export interface AnalyticsQueryDto {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

export interface BookingsSummary {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  conversionRate: number;
  growthRate: number;
}

export interface BookingTrend {
  period: string;
  bookings: number;
  revenue: number;
  date: string;
}

export interface RouteAnalytics {
  routeId: string;
  routeName: string;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
}

export interface ConversionAnalytics {
  totalViews: number;
  totalSearches: number;
  totalBookings: number;
  searchToBookingRate: number;
  viewToBookingRate: number;
}

export interface MetricsData {
  totalBookings: number;
  bookingGrowth: number;
  popularRoutes: RouteAnalytics[];
  seatOccupancyRate: number;
}

// Legacy Revenue Analytics Types (kept for backward compatibility)
export interface TotalRevenueResponse {
  totalRevenue: number;
  currency: string;
  period: {
    startDate: string;
    endDate: string;
  };
  growthPercentage?: number;
  previousPeriodRevenue?: number;
}

export interface RevenueByDayData {
  date: string; // ISO date string (YYYY-MM-DD)
  revenue: number;
  ticketCount: number;
  tripCount: number;
}

export interface RevenueByDayResponse {
  data: RevenueByDayData[];
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  averageDailyRevenue: number;
}

export interface RevenueByRouteData {
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  revenue: number;
  ticketCount: number;
  tripCount: string;
  averageTicketPrice: number;
  operatorId: string;
  operatorName: string;
}

export interface RevenueByRouteResponse {
  data: RevenueByRouteData[];
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalRoutes: number;
}

export interface TicketCountData {
  totalTickets: number;
  confirmedTickets: number;
  pendingTickets: number;
  cancelledTickets: number;
  period: {
    startDate: string;
    endDate: string;
  };
  ticketsByStatus: {
    status: 'confirmed' | 'pending' | 'cancelled';
    count: number;
    percentage: number;
  }[];
}

export interface DashboardAnalyticsResponse {
  totalRevenue: TotalRevenueResponse;
  revenueByDay: RevenueByDayResponse;
  revenueByRoute: RevenueByRouteResponse;
  ticketCount: TicketCountData;
  lastUpdated: string;
}

// Analytics Service
export class AnalyticsService {
  private basePath = "/analytics";

  // Admin Analytics Endpoints (new backend integration)
  async getBookingsSummary(params?: AnalyticsQueryDto): Promise<BookingsSummary> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/bookings/summary${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  async getBookingsTrends(params?: AnalyticsQueryDto): Promise<BookingTrend[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/bookings/trends${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  async getRouteAnalytics(params?: AnalyticsQueryDto): Promise<RouteAnalytics[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/bookings/routes${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  async getConversionAnalytics(params?: AnalyticsQueryDto): Promise<ConversionAnalytics> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/conversion${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  // Metrics Endpoints
  async getTotalBookingsCount(params?: AnalyticsQueryDto): Promise<{ totalBookings: number }> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/metrics/total-bookings${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  async getBookingGrowth(params?: AnalyticsQueryDto): Promise<{ bookingGrowth: number }> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/metrics/booking-growth${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  async getMostPopularRoutes(params?: AnalyticsQueryDto): Promise<RouteAnalytics[]> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/metrics/popular-routes${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  async getSeatOccupancyRate(params?: AnalyticsQueryDto): Promise<{ seatOccupancyRate: number }> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.period) searchParams.append('period', params.period);

    const response = await api.get(`/admin/analytics/metrics/seat-occupancy${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
    return response.data;
  }

  // Legacy Revenue Analytics (kept for backward compatibility)
  // Get total revenue for a period
  async getTotalRevenue(startDate?: string, endDate?: string): Promise<TotalRevenueResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${this.basePath}/revenue/total?${params.toString()}`);
    return response.data;
  }

  // Get revenue breakdown by day
  async getRevenueByDay(startDate?: string, endDate?: string): Promise<RevenueByDayResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${this.basePath}/revenue/by-day?${params.toString()}`);
    return response.data;
  }

  // Get revenue breakdown by route
  async getRevenueByRoute(startDate?: string, endDate?: string, limit?: number): Promise<RevenueByRouteResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`${this.basePath}/revenue/by-route?${params.toString()}`);
    return response.data;
  }

  // Get ticket count analytics
  async getTicketCount(startDate?: string, endDate?: string): Promise<TicketCountData> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${this.basePath}/tickets/count?${params.toString()}`);
    return response.data;
  }

  // Get complete dashboard analytics
  async getDashboardAnalytics(startDate?: string, endDate?: string): Promise<DashboardAnalyticsResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${this.basePath}/dashboard?${params.toString()}`);
    return response.data;
  }

  // Get revenue trends (for charts)
  async getRevenueTrends(
    period: 'day' | 'week' | 'month' | 'year' = 'day',
    startDate?: string, 
    endDate?: string
  ): Promise<RevenueByDayResponse> {
    const params = new URLSearchParams();
    params.append('period', period);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${this.basePath}/revenue/trends?${params.toString()}`);
    return response.data;
  }

  // Get top performing routes
  async getTopRoutes(limit: number = 10, startDate?: string, endDate?: string): Promise<RevenueByRouteData[]> {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`${this.basePath}/routes/top-performing?${params.toString()}`);
    return response.data;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export default
export default analyticsService;