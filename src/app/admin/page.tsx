"use client";

import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";
import { MobileNavDropdown } from "@/components/dashboard/MobileNavDropdown/MobileNavDropdown";
import { Header } from "@/components/dashboard/Header/Header";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import ProtectedRole from "@/components/ProtectedRole";

const mobileMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Route, label: "Manage Routes", href: "/admin/routes" },
  { icon: Truck, label: "Manage Trips", href: "/admin/trips" },
  { icon: Ticket, label: "Manage Tickets", href: "/admin/tickets" },
  { icon: Users, label: "Manage Passengers", href: "/admin/passengers" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

const dashboardData = {
  stats: [
    {
      title: "Total Routes",
      value: "260,200",
      subtitle: "3 Admin",
      icon: <Route className="w-6 h-6" />,
      bgColor: "bg-primary",
    },
    {
      title: "Total Trips",
      value: "375,00",
      subtitle: "$4,00m",
      icon: <MapPin className="w-6 h-6" />,
      bgColor: "bg-accent",
    },
    {
      title: "Tickets Sold",
      value: "88,230",
      subtitle: "$4,00m",
      icon: <TicketCheck className="w-6 h-6" />,
      bgColor: "bg-secondary",
    },
    {
      title: "Revenue",
      value: "225,702",
      subtitle: "3k,00m",
      icon: <TrendingUp className="w-6 h-6" />,
      bgColor: "bg-accent",
    },
  ],
  dailyAnalytics: [
    { day: "Mon", value: 120 },
    { day: "Tue", value: 240 },
    { day: "Wed", value: 140 },
    { day: "Thu", value: 220 },
    { day: "Fri", value: 290 },
    { day: "Sat", value: 250 },
    { day: "Sun", value: 320 },
  ],
  dailyRevenue: [
    { time: "00", value: 30 },
    { time: "20", value: 60 },
    { time: "40", value: 80 },
    { time: "60", value: 110 },
    { time: "80", value: 130 },
    { time: "100", value: 150 },
    { time: "120", value: 170 },
    { time: "140", value: 190 },
    { time: "160", value: 210 },
  ],
  bookingStatus: [
    { name: "Ticket sold", value: 45, fill: "#5B5FFF" },
    { name: "10/7 & Time", value: 25, fill: "#FDB927" },
    { name: "Export Stunt", value: 20, fill: "#92D14F" },
    { name: "1301 e Home", value: 10, fill: "#66A3E0" },
  ],
  recentBookings: [
    {
      id: "BOOK001",
      passengerId: "PS001",
      route: "HN-SG",
      date: "2024-11-21",
      price: "$45.00",
      status: "Confirmed",
    },
    {
      id: "BOOK002",
      passengerId: "PS002",
      route: "SG-DN",
      date: "2024-11-22",
      price: "$32.50",
      status: "Pending",
    },
    {
      id: "BOOK003",
      passengerId: "PS003",
      route: "DN-HN",
      date: "2024-11-23",
      price: "$38.75",
      status: "Confirmed",
    },
    {
      id: "BOOK004",
      passengerId: "PS004",
      route: "HN-HP",
      date: "2024-11-24",
      price: "$25.00",
      status: "Cancelled",
    },
    {
      id: "BOOK005",
      passengerId: "PS005",
      route: "SG-CT",
      date: "2024-11-25",
      price: "$28.00",
      status: "Confirmed",
    },
  ],
  sidebarLineChart: [
    { name: "Jan", value: 400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: 200 },
    { name: "Apr", value: 278 },
    { name: "May", value: 189 },
    { name: "Jun", value: 239 },
  ],
  sidebarPieChart: [
    { name: "HN-SG", value: 30, fill: "#0206f3ff" },
    { name: "SG-DN", value: 30, fill: "#2c4bf7ff" },
    { name: "DN-HN", value: 20, fill: "#1d8fecff" },
    { name: "Others", value: 20, fill: "#c9dee7ff" },
  ],
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
  const { theme } = useTheme();

  // Dynamic grid color based on theme
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";

  return (
    <div className="flex bg-background min-h-screen">
      {/* Sidebar - Desktop only */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile Navigation Dropdown */}
        <MobileNavDropdown menuItems={mobileMenuItems} title="Admin Dashboard" />

        {/* Content Area */}
        <main className="flex-1 pt-4 px-4">
          <div className="flex flex-col xl:flex-row gap-2">
            {/* Main Content - Full width on mobile, 2/3 on desktop */}
            <div className="flex-1 xl:w-2/3 space-y-2">
              {/* Top Section - Stats Cards */}
              <div className="bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
                <h2 className="text-h2 text-card-foreground mb-6">
                  Statistics Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                  {dashboardData.stats.map((stat, index) => (
                    <StatCard
                      key={index}
                      title={stat.title}
                      value={stat.value}
                      subtitle={stat.subtitle}
                      icon={stat.icon}
                      bgColor={stat.bgColor}
                    />
                  ))}
                </div>
              </div>

              {/* Middle Section - Charts */}
              <div className="bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
                <h2 className="text-h2 text-card-foreground mb-6">
                  Analytics Dashboard
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* Daily Analytics */}
                  <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                    <h3 className="text-h3 text-card-foreground mb-4">
                      Daily & Analytics
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
                      Daily Revenue
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
              </div>

              {/* Bottom Section - Recent Bookings Table */}
              <div className="bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
                <h2 className="text-h2 text-card-foreground mb-4 md:mb-6">
                  Recent Bookings
                </h2>
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
                        <th className="text-left py-3 px-2 md:px-4 text-muted-foreground font-semibold"></th>
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
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === "Confirmed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : booking.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : booking.status === "Cancelled"
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 md:px-4">
                            <button className="text-primary hover:underline">
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Full width on mobile, 1/3 on desktop */}
            <div className="w-full xl:w-1/3 bg-card dark:bg-black rounded-md p-4 md:p-6 shadow-sm border border-border">
              <div className="space-y-3 md:space-y-4">
                {/* Line Chart Card */}
                <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                  <h3 className="text-h3 text-card-foreground mb-4">
                    Monthly Trends
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={dashboardData.sidebarLineChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#5B5FFF"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart Card */}
                <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                  <h3 className="text-h3 text-card-foreground mb-4">
                    Tickets Sold Per Route
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={dashboardData.sidebarPieChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        dataKey="value"
                        label={false}
                      >
                        {dashboardData.sidebarPieChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 text-caption">
                    {dashboardData.sidebarPieChart.map((item, index) => (
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
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                  <h3 className="text-h3 text-card-foreground mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/admin/trips'}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Trip
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
