import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { 
  analyticsService, 
  TotalRevenueResponse,
  RevenueByDayResponse,
  RevenueByRouteResponse,
  TicketCountData,
  DashboardAnalyticsResponse,
  RevenueByRouteData
} from '@/services/analytics.service';

// Query keys for cache management
export const analyticsKeys = {
  all: ['analytics'] as const,
  totalRevenue: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'totalRevenue', { startDate, endDate }] as const,
  revenueByDay: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'revenueByDay', { startDate, endDate }] as const,
  revenueByRoute: (startDate?: string, endDate?: string, limit?: number) => 
    [...analyticsKeys.all, 'revenueByRoute', { startDate, endDate, limit }] as const,
  ticketCount: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'ticketCount', { startDate, endDate }] as const,
  dashboard: (startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'dashboard', { startDate, endDate }] as const,
  revenueTrends: (period: string, startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'revenueTrends', { period, startDate, endDate }] as const,
  topRoutes: (limit: number, startDate?: string, endDate?: string) => 
    [...analyticsKeys.all, 'topRoutes', { limit, startDate, endDate }] as const,
};

// Hook for total revenue
export function useTotalRevenue(
  startDate?: string, 
  endDate?: string,
  options?: UseQueryOptions<TotalRevenueResponse>
) {
  return useQuery({
    queryKey: analyticsKeys.totalRevenue(startDate, endDate),
    queryFn: () => analyticsService.getTotalRevenue(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for revenue by day
export function useRevenueByDay(
  startDate?: string, 
  endDate?: string,
  options?: UseQueryOptions<RevenueByDayResponse>
) {
  return useQuery({
    queryKey: analyticsKeys.revenueByDay(startDate, endDate),
    queryFn: () => analyticsService.getRevenueByDay(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for revenue by route
export function useRevenueByRoute(
  startDate?: string, 
  endDate?: string, 
  limit?: number,
  options?: UseQueryOptions<RevenueByRouteResponse>
) {
  return useQuery({
    queryKey: analyticsKeys.revenueByRoute(startDate, endDate, limit),
    queryFn: () => analyticsService.getRevenueByRoute(startDate, endDate, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for ticket count
export function useTicketCount(
  startDate?: string, 
  endDate?: string,
  options?: UseQueryOptions<TicketCountData>
) {
  return useQuery({
    queryKey: analyticsKeys.ticketCount(startDate, endDate),
    queryFn: () => analyticsService.getTicketCount(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for complete dashboard analytics
export function useDashboardAnalytics(
  startDate?: string, 
  endDate?: string,
  options?: UseQueryOptions<DashboardAnalyticsResponse>
) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(startDate, endDate),
    queryFn: () => analyticsService.getDashboardAnalytics(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for revenue trends
export function useRevenueTrends(
  period: 'day' | 'week' | 'month' | 'year' = 'day',
  startDate?: string, 
  endDate?: string,
  options?: UseQueryOptions<RevenueByDayResponse>
) {
  return useQuery({
    queryKey: analyticsKeys.revenueTrends(period, startDate, endDate),
    queryFn: () => analyticsService.getRevenueTrends(period, startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Hook for top performing routes
export function useTopRoutes(
  limit: number = 10,
  startDate?: string, 
  endDate?: string,
  options?: UseQueryOptions<RevenueByRouteData[]>
) {
  return useQuery({
    queryKey: analyticsKeys.topRoutes(limit, startDate, endDate),
    queryFn: () => analyticsService.getTopRoutes(limit, startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// Utility hook for date range analytics (commonly used together)
export function useDateRangeAnalytics(startDate?: string, endDate?: string) {
  const totalRevenue = useTotalRevenue(startDate, endDate);
  const revenueByDay = useRevenueByDay(startDate, endDate);
  const revenueByRoute = useRevenueByRoute(startDate, endDate, 10);
  const ticketCount = useTicketCount(startDate, endDate);

  return {
    totalRevenue,
    revenueByDay,
    revenueByRoute,
    ticketCount,
    isLoading: totalRevenue.isLoading || revenueByDay.isLoading || revenueByRoute.isLoading || ticketCount.isLoading,
    isError: totalRevenue.isError || revenueByDay.isError || revenueByRoute.isError || ticketCount.isError,
    error: totalRevenue.error || revenueByDay.error || revenueByRoute.error || ticketCount.error,
  };
}