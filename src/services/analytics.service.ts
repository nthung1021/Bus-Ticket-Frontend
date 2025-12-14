import api from "@/lib/api";

// Revenue Analytics Types
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