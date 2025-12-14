"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown, BarChart3, Users, Ticket } from "lucide-react";
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

  // Mock data - replace with actual API calls
  const revenueData = {
    today: {
      revenue: 12450,
      growth: 8.5,
      tickets: 156,
      transactions: 142
    },
    week: {
      revenue: 89750,
      growth: 12.3,
      tickets: 1087,
      transactions: 982
    },
    month: {
      revenue: 345600,
      growth: -2.1,
      tickets: 4521,
      transactions: 4123
    }
  };

  const dailyRevenueData = [
    { date: '2024-12-09', revenue: 8500, tickets: 98 },
    { date: '2024-12-10', revenue: 9200, tickets: 112 },
    { date: '2024-12-11', revenue: 7800, tickets: 89 },
    { date: '2024-12-12', revenue: 11400, tickets: 134 },
    { date: '2024-12-13', revenue: 10200, tickets: 118 },
    { date: '2024-12-14', revenue: 13100, tickets: 156 },
    { date: '2024-12-15', revenue: 12450, tickets: 142 },
  ];

  const weeklyRevenueData = [
    { week: 'Week 1', revenue: 67800, tickets: 789 },
    { week: 'Week 2', revenue: 72100, tickets: 845 },
    { week: 'Week 3', revenue: 89750, tickets: 1087 },
  ];

  const monthlyRevenueData = [
    { month: 'Oct', revenue: 298500, tickets: 3789 },
    { month: 'Nov', revenue: 354200, tickets: 4123 },
    { month: 'Dec', revenue: 345600, tickets: 4521 },
  ];

  const routePerformanceData = [
    { route: 'HCM - Da Nang', revenue: 45600, percentage: 32 },
    { route: 'Ha Noi - Hai Phong', revenue: 38900, percentage: 28 },
    { route: 'HCM - Nha Trang', revenue: 28700, percentage: 20 },
    { route: 'Da Nang - Hoi An', revenue: 18400, percentage: 13 },
    { route: 'Others', revenue: 9800, percentage: 7 },
  ];

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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Revenue Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getChartData()}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey={selectedPeriod === 'month' ? 'month' : selectedPeriod === 'week' ? 'date' : 'date'} 
                        tickFormatter={(value) => {
                          if (selectedPeriod === 'month') return value;
                          return format(new Date(value), 'MMM dd');
                        }}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000)}k`} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        labelFormatter={(label) => {
                          if (selectedPeriod === 'month') return label;
                          return format(new Date(label), 'MMM dd, yyyy');
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Route Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Top Routes by Revenue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={routePerformanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.percentage}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {routePerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];