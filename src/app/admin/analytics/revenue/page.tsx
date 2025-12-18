"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown, BarChart3, Users, Ticket, CreditCard } from "lucide-react";
import ProtectedRole from "@/components/ProtectedRole";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, startOfToday, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from "date-fns";
import { analyticsService, BookingsSummary, BookingTrend, RouteAnalytics } from "@/services/analytics.service";
import { toast } from "sonner";

export default function RevenueAnalyticsPage() {
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <>
        <RevenueAnalyticsContent />
      </>
    </ProtectedRole>
  );
}

function RevenueAnalyticsContent() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [bookingsSummary, setBookingsSummary] = useState<BookingsSummary | null>(null);
  const [bookingsTrends, setBookingsTrends] = useState<BookingTrend[]>([]);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalytics[]>([]);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [bookingGrowth, setBookingGrowth] = useState<number>(0);
  const [seatOccupancy, setSeatOccupancy] = useState<number>(0);

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range based on selected period
      let startDate: string;
      let endDate: string = new Date().toISOString();
      
      switch (selectedPeriod) {
        case 'today':
          startDate = startOfToday().toISOString();
          endDate = endOfDay(new Date()).toISOString();
          break;
        case 'week':
          startDate = startOfWeek(new Date()).toISOString();
          endDate = endOfWeek(new Date()).toISOString();
          break;
        case 'month':
          startDate = startOfMonth(new Date()).toISOString();
          endDate = endOfMonth(new Date()).toISOString();
          break;
        default:
          startDate = startOfToday().toISOString();
      }

      const queryParams = {
        startDate: startDate.split('T')[0],
        endDate: endDate.split('T')[0],
        timeframe: selectedPeriod === 'today' ? 'daily' as const : 
                  selectedPeriod === 'week' ? 'weekly' as const : 'monthly' as const
      };

      // Fetch all analytics data
      const [
        summaryData,
        trendsData,
        routesData,
        totalBookingsData,
        growthData,
        occupancyData
      ] = await Promise.all([
        analyticsService.getBookingsSummary(queryParams).catch(() => null),
        analyticsService.getBookingsTrends(queryParams).catch(() => []),
        analyticsService.getRouteAnalytics(queryParams).catch(() => []),
        analyticsService.getTotalBookingsCount(queryParams).catch(() => ({ totalBookings: 0 })),
        analyticsService.getBookingGrowth(queryParams).catch(() => ({ bookingGrowth: 0 })),
        analyticsService.getSeatOccupancyRate(queryParams).catch(() => ({ seatOccupancyRate: 0 }))
      ]);

      setBookingsSummary(summaryData);
      setBookingsTrends(trendsData);
      setRouteAnalytics(routesData);
      setTotalBookings(totalBookingsData.totalBookings);
      setBookingGrowth(growthData.bookingGrowth);
      setSeatOccupancy(occupancyData.seatOccupancyRate);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data. Please check your connection and try again.');
      
      // Set empty/null state instead of mock data
      setBookingsSummary(null);
      setBookingsTrends([]);
      setRouteAnalytics([]);
      setTotalBookings(0);
      setBookingGrowth(0);
      setSeatOccupancy(0);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Derived data for charts
  const revenueData = {
    today: {
      revenue: bookingsSummary?.totalRevenue ?? 0,
      growth: bookingGrowth ?? 0,
      tickets: totalBookings || 0,
      transactions: totalBookings || 0
    },
    week: {
      revenue: bookingsSummary?.totalRevenue ?? 0,
      growth: bookingGrowth ?? 0,
      tickets: totalBookings || 0,
      transactions: totalBookings || 0
    },
    month: {
      revenue: bookingsSummary?.totalRevenue ?? 0,
      growth: bookingGrowth ?? 0,
      tickets: totalBookings || 0,
      transactions: totalBookings || 0
    }
  };

  // Transform trends data for charts
  const dailyRevenueData = bookingsTrends.map(trend => ({
    date: trend.date,
    revenue: trend.revenue,
    tickets: trend.bookings
  }));

  const weeklyRevenueData = bookingsTrends.length > 0
    ? bookingsTrends.slice(-3).map((trend, index) => ({
        week: `Week ${index + 1}`,
        revenue: trend.revenue,
        tickets: trend.bookings
      }))
    : [];

  const monthlyRevenueData = bookingsTrends.length > 0
    ? bookingsTrends.slice(-3).map((trend, index) => ({
        month: format(new Date(trend.date), 'MMM'),
        revenue: trend.revenue,
        tickets: trend.bookings
      }))
    : [];

  // Transform route analytics for charts
  const routePerformanceData = routeAnalytics.length > 0 
    ? routeAnalytics.slice(0, 5).map((route, index) => ({
        route: route.route?.name || `Route ${index + 1}`,
        revenue: route.totalRevenue,
        percentage: route.revenuePercentage || Math.round((route.totalRevenue / (bookingsSummary?.totalRevenue || 1)) * 100)
      }))
    : [];

  // Payment method distribution data (placeholder - no API available yet)
  const paymentMethodData = [
    { method: 'Credit Card', amount: revenueData[selectedPeriod].revenue * 0.45, percentage: 45, color: '#0088FE' },
    { method: 'Bank Transfer', amount: revenueData[selectedPeriod].revenue * 0.35, percentage: 35, color: '#00C49F' },
    { method: 'Digital Wallet', amount: revenueData[selectedPeriod].revenue * 0.15, percentage: 15, color: '#FFBB28' },
    { method: 'Cash', amount: revenueData[selectedPeriod].revenue * 0.05, percentage: 5, color: '#FF8042' },
  ];

  // Use real trends data only
  const revenueOverTimeData = dailyRevenueData;

  const getCurrentData = () => {
    return revenueData[selectedPeriod];
  };

  const getChartData = () => {
    switch (selectedPeriod) {
      case 'today':
        return dailyRevenueData.slice(-1);
      case 'week':
        return dailyRevenueData;
      case 'month':
        return monthlyRevenueData;
      default:
        return dailyRevenueData;
    }
  };

  const formatCurrency = (amount: number) => {
    // Smart currency detection - if amount is too high, it might be in cents
    const displayAmount = amount > 100000 ? amount / 100 : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(displayAmount);
  };

  // Helper function to safely format numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Loading component
  const LoadingCard = ({ height }: { height: string }) => (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  // Empty state component
  const EmptyStateCard = ({ height, title, description }: { height: string; title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
      <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );

  const currentData = getCurrentData();

  return (
    <div className="flex bg-background min-h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <main className="flex-1 pt-10 px-6 pb-6 overflow-auto">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col space-y-2 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">Revenue Analytics</h1>
                <p className="text-muted-foreground">Track and analyze revenue performance across different time periods</p>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            </div>

            {/* Period Selection */}
            <div className="flex space-x-2">
              <Button
                variant={selectedPeriod === 'today' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('today')}
                size="sm"
              >
                Today
              </Button>
              <Button
                variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('week')}
                size="sm"
              >
                This Week
              </Button>
              <Button
                variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod('month')}
                size="sm"
              >
                This Month
              </Button>
            </div>

            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(currentData.revenue)}</div>
                  <div className="flex items-center space-x-1 text-xs">
                    {currentData.growth > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">+{currentData.growth}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">{currentData.growth}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">from last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentData.tickets.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(currentData.revenue / currentData.tickets)}/ticket
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentData.transactions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Success rate: {((currentData.transactions / currentData.tickets) * 100).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Revenue/Day</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(selectedPeriod === 'today' ? currentData.revenue : 
                      selectedPeriod === 'week' ? currentData.revenue / 7 : 
                      currentData.revenue / 30)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPeriod === 'today' ? 'Today only' : 
                     selectedPeriod === 'week' ? 'Last 7 days' : 
                     'Last 30 days'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Revenue Over Time - Line Chart */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Revenue Over Time</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <LoadingCard height="300px" />
                  ) : revenueOverTimeData.length === 0 ? (
                    <EmptyStateCard 
                      height="300px" 
                      title="No Revenue Data"
                      description="No revenue data available for the selected period"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueOverTimeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => `${(value / 1000)}k`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                          labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#3b82f6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method Distribution - Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment Methods</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <LoadingCard height="300px" />
                  ) : paymentMethodData.length === 0 ? (
                    <EmptyStateCard 
                      height="300px" 
                      title="No Payment Data"
                      description="No payment method data available"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={paymentMethodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ payload }) => `${payload.method}\n${payload.percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="percentage"
                        >
                          {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value}%`, 'Share']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Route - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Revenue by Route</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingCard height="400px" />
                ) : routePerformanceData.length === 0 ? (
                  <EmptyStateCard 
                    height="400px" 
                    title="No Route Data"
                    description="No route performance data available"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={routePerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="route" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000)}k`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      >
                        {routePerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Route Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Route Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingCard height="300px" />
                ) : routePerformanceData.length === 0 ? (
                  <EmptyStateCard 
                    height="300px" 
                    title="No Route Data"
                    description="No route performance data available"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Route</th>
                          <th className="text-right p-3">Revenue</th>
                          <th className="text-right p-3">Percentage</th>
                          <th className="text-center p-3">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routePerformanceData.map((route, index) => (
                          <tr key={route.route} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium">{route.route}</span>
                              </div>
                            </td>
                            <td className="text-right p-3 font-medium">
                              {formatCurrency(route.revenue)}
                            </td>
                            <td className="text-right p-3">
                              {route.percentage}%
                            </td>
                            <td className="text-center p-3">
                              <Badge variant={
                                route.percentage >= 30 ? 'default' : 
                                route.percentage >= 20 ? 'secondary' : 
                                'outline'
                              }>
                                {route.percentage >= 30 ? 'High' : 
                                 route.percentage >= 20 ? 'Medium' : 
                                 'Low'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];