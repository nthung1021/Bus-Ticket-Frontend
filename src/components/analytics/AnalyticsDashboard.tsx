// Example usage of analytics API in dashboard component

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import {
  useTotalRevenue,
  useRevenueByDay,
  useRevenueByRoute,
  useTicketCount,
  useDateRangeAnalytics
} from '@/hooks/useAnalytics';
import {
  LineChart,
  Line,
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
} from 'recharts';

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    to: new Date()
  });

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  // Use individual hooks
  const { data: totalRevenue, isLoading: revenueLoading } = useTotalRevenue(startDate, endDate);
  const { data: revenueByDay, isLoading: dayLoading } = useRevenueByDay(startDate, endDate);
  const { data: revenueByRoute, isLoading: routeLoading } = useRevenueByRoute(startDate, endDate, 5);
  const { data: ticketCount, isLoading: ticketLoading } = useTicketCount(startDate, endDate);

  // Or use combined hook
  // const analytics = useDateRangeAnalytics(startDate, endDate);

  if (revenueLoading || dayLoading || routeLoading || ticketLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue?.totalRevenue.toLocaleString()}
            </div>
            {totalRevenue?.growthPercentage && (
              <p className="text-xs text-muted-foreground">
                {totalRevenue.growthPercentage > 0 ? '+' : ''}
                {totalRevenue.growthPercentage.toFixed(1)}% from last period
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ticketCount?.totalTickets.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {ticketCount?.confirmedTickets} confirmed, {ticketCount?.pendingTickets} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Daily Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${revenueByDay?.averageDailyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Over {revenueByDay?.data.length} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueByRoute?.totalRoutes}
            </div>
            <p className="text-xs text-muted-foreground">
              Routes with revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByDay?.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Route Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Routes by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByRoute?.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="routeName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Status Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketCount?.ticketsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.status}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {ticketCount?.ticketsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Route Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Route Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Route</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Tickets</th>
                  <th className="text-right p-2">Avg Price</th>
                  <th className="text-left p-2">Operator</th>
                </tr>
              </thead>
              <tbody>
                {revenueByRoute?.data.map((route) => (
                  <tr key={route.routeId} className="border-b">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{route.routeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {route.origin} → {route.destination}
                        </div>
                      </div>
                    </td>
                    <td className="text-right p-2">${route.revenue.toLocaleString()}</td>
                    <td className="text-right p-2">{route.ticketCount}</td>
                    <td className="text-right p-2">${route.averageTicketPrice.toFixed(2)}</td>
                    <td className="p-2">{route.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default AnalyticsDashboard;