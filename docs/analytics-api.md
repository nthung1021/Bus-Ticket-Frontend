# Analytics API Documentation

## Overview
This documentation outlines the API response structures for dashboard analytics including revenue data, ticket counts, and performance metrics.

## API Endpoints

### 1. Total Revenue
**GET** `/api/analytics/revenue/total`

**Query Parameters:**
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```typescript
{
  totalRevenue: number;
  currency: string;
  period: {
    startDate: string;
    endDate: string;
  };
  growthPercentage?: number;
  previousPeriodRevenue?: number;
}
```

### 2. Revenue by Day
**GET** `/api/analytics/revenue/by-day`

**Query Parameters:**
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```typescript
{
  data: Array<{
    date: string; // YYYY-MM-DD
    revenue: number;
    ticketCount: number;
    tripCount: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  averageDailyRevenue: number;
}
```

### 3. Revenue by Route
**GET** `/api/analytics/revenue/by-route`

**Query Parameters:**
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)
- `limit` (optional): Number of top routes to return

**Response:**
```typescript
{
  data: Array<{
    routeId: string;
    routeName: string;
    origin: string;
    destination: string;
    revenue: number;
    ticketCount: number;
    tripCount: number;
    averageTicketPrice: number;
    operatorId: string;
    operatorName: string;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
  totalRevenue: number;
  totalRoutes: number;
}
```

### 4. Ticket Count Analytics
**GET** `/api/analytics/tickets/count`

**Query Parameters:**
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```typescript
{
  totalTickets: number;
  confirmedTickets: number;
  pendingTickets: number;
  cancelledTickets: number;
  period: {
    startDate: string;
    endDate: string;
  };
  ticketsByStatus: Array<{
    status: 'confirmed' | 'pending' | 'cancelled';
    count: number;
    percentage: number;
  }>;
}
```

### 5. Dashboard Analytics (Combined)
**GET** `/api/analytics/dashboard`

**Query Parameters:**
- `startDate` (optional): ISO date string (YYYY-MM-DD)
- `endDate` (optional): ISO date string (YYYY-MM-DD)

**Response:**
```typescript
{
  totalRevenue: TotalRevenueResponse;
  revenueByDay: RevenueByDayResponse;
  revenueByRoute: RevenueByRouteResponse;
  ticketCount: TicketCountData;
  lastUpdated: string; // ISO timestamp
}
```

## Frontend Usage

### 1. Using Individual Hooks
```typescript
import {
  useTotalRevenue,
  useRevenueByDay,
  useRevenueByRoute,
  useTicketCount
} from '@/hooks/useAnalytics';

function DashboardComponent() {
  const { data: revenue, isLoading } = useTotalRevenue('2024-01-01', '2024-01-31');
  const { data: dailyRevenue } = useRevenueByDay('2024-01-01', '2024-01-31');
  const { data: routeRevenue } = useRevenueByRoute('2024-01-01', '2024-01-31', 10);
  const { data: tickets } = useTicketCount('2024-01-01', '2024-01-31');

  // Component logic here
}
```

### 2. Using Combined Hook
```typescript
import { useDateRangeAnalytics } from '@/hooks/useAnalytics';

function DashboardComponent() {
  const analytics = useDateRangeAnalytics('2024-01-01', '2024-01-31');
  
  if (analytics.isLoading) return <div>Loading...</div>;
  
  const { totalRevenue, revenueByDay, revenueByRoute, ticketCount } = analytics;
  // Component logic here
}
```

### 3. Direct Service Usage
```typescript
import { analyticsService } from '@/services/analytics.service';

async function fetchAnalytics() {
  try {
    const revenue = await analyticsService.getTotalRevenue('2024-01-01', '2024-01-31');
    const trends = await analyticsService.getRevenueTrends('day', '2024-01-01', '2024-01-31');
    const topRoutes = await analyticsService.getTopRoutes(5, '2024-01-01', '2024-01-31');
    
    // Handle data
  } catch (error) {
    console.error('Analytics fetch failed:', error);
  }
}
```

## Additional Features

### Revenue Trends
**GET** `/api/analytics/revenue/trends`

**Query Parameters:**
- `period`: 'day' | 'week' | 'month' | 'year'
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

### Top Performing Routes
**GET** `/api/analytics/routes/top-performing`

**Query Parameters:**
- `limit`: Number of routes to return (default: 10)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

## Error Handling

All endpoints return standard HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

Error Response Format:
```typescript
{
  error: string;
  message: string;
  statusCode: number;
}
```

## Caching Strategy

Frontend uses React Query with:
- **Stale Time**: 5 minutes
- **Cache Time**: 30 minutes
- **Background Refetch**: On window focus
- **Retry**: 3 attempts on failure

## Performance Considerations

1. **Date Range Limits**: Recommend limiting queries to 1 year maximum
2. **Real-time Updates**: Data refreshes every 5 minutes automatically
3. **Pagination**: Use `limit` parameter for large datasets
4. **Caching**: Responses are cached based on date parameters