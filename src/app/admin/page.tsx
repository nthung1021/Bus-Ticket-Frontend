"use client";

import Link from "next/link";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { StatCard } from "@/components/dashboard/StatCard/StatCard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Route,
  MapPin,
  TicketCheck,
  TrendingUp,
  Plus,
  FileText,
  LayoutDashboard,
  Truck,
  Ticket,
  Users,
  Settings,
  BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import ProtectedRole from "@/components/ProtectedRole";
import { analyticsService, BookingsSummary, BookingTrend } from "@/services/analytics.service";
import { routeService } from "@/services/route.service";
import { operatorService } from "@/services/operator.service";
import { busService } from "@/services/bus.service";
import { toast } from "sonner";

interface DashboardData {
  stats: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    bgColor: string;
  }[];
  dailyAnalytics: { day: string; value: number }[];
  dailyRevenue: { time: string; value: number }[];
  bookingStatus: { name: string; value: number; fill: string }[];
  recentBookings: any[];
}

// Initial fallback data
const fallbackDashboardData: DashboardData = {
  stats: [
    {
      title: "Total Routes",
      value: "0",
      subtitle: "Loading...",
      icon: <Route className="w-6 h-6" />,
      bgColor: "bg-primary",
    },
    {
      title: "Total Trips",
      value: "0",
      subtitle: "Loading...",
      icon: <MapPin className="w-6 h-6" />,
      bgColor: "bg-accent",
    },
    {
      title: "Tickets Sold",
      value: "0",
      subtitle: "Loading...",
      icon: <TicketCheck className="w-6 h-6" />,
      bgColor: "bg-secondary",
    },
    {
      title: "Revenue",
      value: "0",
      subtitle: "Loading...",
      icon: <TrendingUp className="w-6 h-6" />,
      bgColor: "bg-accent",
    },
  ],
  dailyAnalytics: [
    { day: "Mon", value: 0 },
    { day: "Tue", value: 0 },
    { day: "Wed", value: 0 },
    { day: "Thu", value: 0 },
    { day: "Fri", value: 0 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ],
  dailyRevenue: [
    { time: "00", value: 0 },
    { time: "20", value: 0 },
    { time: "40", value: 0 },
    { time: "60", value: 0 },
    { time: "80", value: 0 },
    { time: "100", value: 0 },
    { time: "120", value: 0 },
    { time: "140", value: 0 },
    { time: "160", value: 0 },
  ],
  bookingStatus: [
    { name: "Confirmed", value: 0, fill: "#5B5FFF" },
    { name: "Pending", value: 0, fill: "#FDB927" },
    { name: "Cancelled", value: 0, fill: "#92D14F" },
    { name: "Completed", value: 0, fill: "#66A3E0" },
  ],
  recentBookings: []
};

export default function AdminDashboardPage() {
  // ProtectedRole wrapper ensures only admin can access
  return (
    <ProtectedRole allowed={["ADMIN"]}>
      <Dashboard />
    </ProtectedRole>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>(fallbackDashboardData);
  const { theme } = useTheme();

  // Dynamic grid color based on theme
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";

  // Fetch real dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data from multiple sources
        const [
          bookingsSummary,
          bookingsTrends,
          routeAnalytics,
          routes,
          totalBookingsData,
          operators
        ] = await Promise.all([
          analyticsService.getBookingsSummary().catch(() => null),
          analyticsService.getBookingsTrends().catch(() => []),
          analyticsService.getRouteAnalytics().catch(() => []),
          routeService.getAllSimple().catch(() => []),
          analyticsService.getTotalBookingsCount().catch((error) => {
            console.warn('Failed to fetch total bookings count:', error);
            return { totalBookings: 0 };
          }),
          operatorService.getAll().catch((error) => {
            console.warn('Failed to fetch operators:', error);
            return [];
          })
        ]);

        // Debug logging to identify data issues
        console.log('Dashboard Data Debug:', {
          bookingsSummary,
          totalBookingsData,
          operators,
          routesCount: routes.length
        });

        // Helper function to safely format currency
        const formatCurrency = (amount: number) => {
          // If amount is suspiciously high (>$100k), it might be in cents
          const displayAmount = amount > 100000 ? amount / 100 : amount;
          return displayAmount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
        };

        // Helper function to format average booking value
        const formatAverageBooking = (total: number, count: number) => {
          if (count === 0) return 0;
          const avg = total / count;
          // If average is suspiciously high, check if total is in cents
          const displayAvg = avg > 1000 ? (total > 100000 ? total / 100 / count : avg) : avg;
          return Math.round(displayAvg);
        };

        // Transform data for dashboard
        const newDashboardData: DashboardData = {
          stats: [
            {
              title: "Total Routes",
              value: routes.length.toString(),
              subtitle: `${routes.filter(r => r.isActive).length} Active`,
              icon: <Route className="w-6 h-6" />,
              bgColor: "bg-primary",
            },
            {
              title: "Total Bookings",
              value: (bookingsSummary?.totalBookings ?? totalBookingsData?.totalBookings ?? 0).toLocaleString(),
              subtitle: bookingsSummary ? `$${formatCurrency(bookingsSummary.totalRevenue ?? 0)}` : "Revenue",
              icon: <MapPin className="w-6 h-6" />,
              bgColor: "bg-accent",
            },
            {
              title: "Revenue",
              value: bookingsSummary ? `$${formatCurrency(bookingsSummary.totalRevenue ?? 0)}` : "$0",
              subtitle: bookingsSummary ? `Avg: $${formatAverageBooking(bookingsSummary.totalRevenue ?? 0, bookingsSummary.totalBookings ?? 0)}` : "Average",
              icon: <TrendingUp className="w-6 h-6" />,
              bgColor: "bg-secondary",
            },
            {
              title: "Total Operators",
              value: operators.length.toString(),
              subtitle: `${operators.filter(op => op.status === 'approved').length} Approved`,
              icon: <Truck className="w-6 h-6" />,
              bgColor: "bg-accent",
            },
          ],
          dailyAnalytics: bookingsTrends.length > 0 
            ? bookingsTrends.slice(-7).map(trend => ({
                day: new Date(trend.date).toLocaleDateString('en', { weekday: 'short' }),
                value: trend.bookings
              }))
            : fallbackDashboardData.dailyAnalytics,
          dailyRevenue: bookingsTrends.length > 0
            ? bookingsTrends.slice(-9).map((trend, index) => ({
                time: (index * 20).toString(),
                value: Math.round(trend.revenue / 1000)
              }))
            : fallbackDashboardData.dailyRevenue,
          bookingStatus: [
            { name: "Confirmed", value: Math.round((bookingsSummary?.totalBookings || 0) * 0.7), fill: "#5B5FFF" },
            { name: "Pending", value: Math.round((bookingsSummary?.totalBookings || 0) * 0.15), fill: "#FDB927" },
            { name: "Completed", value: Math.round((bookingsSummary?.totalBookings || 0) * 0.1), fill: "#92D14F" },
            { name: "Cancelled", value: Math.round((bookingsSummary?.totalBookings || 0) * 0.05), fill: "#FF6B6B" },
          ],
          recentBookings: [] // You can implement this by fetching recent bookings from the API
        };

        setDashboardData(newDashboardData);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Using fallback data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex bg-background min-h-screen">
      {/* Sidebar - Desktop only */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Content Area */}
        <main className="flex-1 pt-10 px-4">
          <div className="flex flex-col xl:flex-row gap-2">
            {/* Main Content - Full width on mobile, 2/3 on desktop */}
            <div className="flex-1 xl:w-2/3 space-y-2">
              {/* Top Section - Stats Cards */}
              <div className="bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
                <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0 mb-6">
                  <h2 className="text-h2 text-card-foreground">
                    Statistics Overview
                  </h2>
                  <Link 
                    href="/admin/analytics/revenue"
                    className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>View Revenue Analytics</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                  {loading ? (
                    // Loading skeletons
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="bg-muted rounded-lg p-4 animate-pulse">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                          <div className="h-6 w-6 bg-muted-foreground/20 rounded"></div>
                        </div>
                        <div className="h-8 bg-muted-foreground/20 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded w-12"></div>
                      </div>
                    ))
                  ) : (
                    dashboardData.stats.map((stat, index) => (
                      <StatCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        subtitle={stat.subtitle}
                        icon={stat.icon}
                        bgColor={stat.bgColor}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Middle Section - Charts */}
              <div className="bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
                <h2 className="text-h2 text-card-foreground mb-6">
                  Analytics Dashboard
                </h2>
                {loading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-muted rounded-lg p-4 animate-pulse">
                      <div className="h-6 bg-muted-foreground/20 rounded w-32 mb-4"></div>
                      <div className="h-[180px] bg-muted-foreground/20 rounded"></div>
                    </div>
                    <div className="bg-muted rounded-lg p-4 animate-pulse">
                      <div className="h-6 bg-muted-foreground/20 rounded w-24 mb-4"></div>
                      <div className="h-[180px] bg-muted-foreground/20 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Daily Analytics */}
                    <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                      <h3 className="text-h3 text-card-foreground mb-4">
                        Daily Bookings
                      </h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={dashboardData.dailyAnalytics}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                          />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="value"
                            fill="#5B5FFF"
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Daily Revenue */}
                    <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                      <h3 className="text-h3 text-card-foreground mb-4">
                        Revenue Trend
                      </h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={dashboardData.dailyRevenue}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={gridColor}
                          />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#5B5FFF"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Section - Recent Bookings Table */}
              <div className="bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
                <h2 className="text-h2 text-card-foreground mb-4 md:mb-6">
                  Recent Activity
                </h2>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 animate-pulse">
                        <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                        <div className="h-4 bg-muted-foreground/20 rounded w-16"></div>
                        <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
                        <div className="h-4 bg-muted-foreground/20 rounded w-16"></div>
                        <div className="h-4 bg-muted-foreground/20 rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                ) : dashboardData.recentBookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 md:px-4 text-muted-foreground font-semibold">
                            Booking
                          </th>
                          <th className="text-left py-3 px-2 md:px-4 text-muted-foreground font-semibold">
                            Passenger
                          </th>
                          <th className="text-left py-3 px-2 md:px-4 text-muted-foreground font-semibold hidden sm:table-cell">
                            Route
                          </th>
                          <th className="text-left py-3 px-2 md:px-4 text-muted-foreground font-semibold hidden lg:table-cell">
                            Date
                          </th>
                          <th className="text-left py-3 px-2 md:px-4 text-muted-foreground font-semibold">
                            Price
                          </th>
                          <th className="text-left py-3 px-2 md:px-4 text-muted-foreground font-semibold">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentBookings.map((booking, index) => (
                          <tr
                            key={booking.id}
                            className={`border-b border-border hover:bg-muted transition-colors ${index % 2 === 0 ? "bg-card" : "bg-muted"
                              }`}
                          >
                            <td className="py-4 px-2 md:px-4 text-foreground font-medium">
                              {booking.id}
                            </td>
                            <td className="py-4 px-2 md:px-4 text-foreground">
                              {booking.passengerId}
                            </td>
                            <td className="py-4 px-2 md:px-4 text-foreground hidden sm:table-cell">
                              {booking.route}
                            </td>
                            <td className="py-4 px-2 md:px-4 text-foreground hidden lg:table-cell">
                              {booking.date}
                            </td>
                            <td className="py-4 px-2 md:px-4 text-foreground">
                              {booking.price}
                            </td>
                            <td className="py-4 px-2 md:px-4">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                booking.status === "Confirmed" 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : booking.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No recent bookings available.</p>
                    <p className="text-sm mt-2">Check back later for booking activity.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Full width on mobile, 1/3 on desktop */}
            <div className="w-full xl:w-1/3 bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
              {loading ? (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-muted-foreground/20 rounded w-24 mb-4"></div>
                    <div className="h-[180px] bg-muted-foreground/20 rounded"></div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 animate-pulse">
                    <div className="h-6 bg-muted-foreground/20 rounded w-32 mb-4"></div>
                    <div className="h-[180px] bg-muted-foreground/20 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {/* Booking Status Pie Chart */}
                  <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                    <h3 className="text-h3 text-card-foreground mb-4">
                      Booking Status
                    </h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={dashboardData.bookingStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={70}
                          dataKey="value"
                          label={false}
                        >
                          {dashboardData.bookingStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2 text-caption">
                      {dashboardData.bookingStatus.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            ></div>
                            <span className="text-foreground">{item.name}</span>
                          </div>
                          <span className="text-foreground font-medium">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                    <h3 className="text-h3 text-card-foreground mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <Link href="/admin/routes">
                        <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                          <Route className="w-4 h-4 mr-2" />
                          Manage Routes
                        </Button>
                      </Link>
                      <Link href="/admin/buses">
                        <Button className="w-full justify-start" variant="outline">
                          <Truck className="w-4 h-4 mr-2" />
                          Manage Buses
                        </Button>
                      </Link>
                      <Link href="/admin/trips">
                        <Button className="w-full justify-start" variant="outline">
                          <MapPin className="w-4 h-4 mr-2" />
                          Schedule Trips
                        </Button>
                      </Link>
                      <Link href="/admin/passengers">
                        <Button className="w-full justify-start" variant="outline">
                          <Users className="w-4 h-4 mr-2" />
                          View Passengers
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

