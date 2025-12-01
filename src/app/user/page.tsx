"use client";

import { UserSidebar } from "@/components/dashboard/UserSidebar/UserSidebar";
import { MobileNavDropdown } from "@/components/dashboard/MobileNavDropdown/MobileNavDropdown";
import { UserHeader } from "@/components/dashboard/UserHeader/UserHeader";
import { StatCard } from "@/components/dashboard/StatCard/StatCard";
import { Clock, Ticket, DollarSign, MapPin, Bus, Calendar, LayoutDashboard, CreditCard, User, Bell, HelpCircle } from "lucide-react";

const userDashboardData = {
  stats: [
    {
      title: "Upcoming Trips",
      value: "3",
      subtitle: "Next: Tomorrow 8:00 AM",
      icon: <Clock className="w-6 h-6" />,
      bgColor: "bg-primary",
    },
    {
      title: "Total Tickets",
      value: "12",
      subtitle: "This year",
      icon: <Ticket className="w-6 h-6" />,
      bgColor: "bg-accent",
    },
    {
      title: "Total Spent",
      value: "$485.50",
      subtitle: "This year",
      icon: <DollarSign className="w-6 h-6" />,
      bgColor: "bg-secondary",
    },
  ],
  upcomingTrips: [
    {
      route: "Hanoi → Ho Chi Minh City",
      busName: "Express Line 101",
      departureTime: "8:00 AM, Nov 22, 2024",
      arrivalTime: "6:00 PM, Nov 22, 2024",
      seatNumber: "A15",
      bookingId: "BT001234",
      status: "Confirmed",
    },
    {
      route: "Da Nang → Hoi An",
      busName: "Coastal Express 205",
      departureTime: "2:00 PM, Nov 25, 2024",
      arrivalTime: "3:30 PM, Nov 25, 2024",
      seatNumber: "B08",
      bookingId: "BT001245",
      status: "Confirmed",
    },
  ],
  recentBookings: [
    {
      id: "BT001234",
      date: "Nov 22, 2024",
      route: "HN → HCM",
      status: "Confirmed",
      price: "$45.00",
    },
    {
      id: "BT001235",
      date: "Nov 18, 2024",
      route: "HCM → DA",
      status: "Completed",
      price: "$32.50",
    },
    {
      id: "BT001236",
      date: "Nov 15, 2024",
      route: "DA → HN",
      status: "Completed",
      price: "$38.75",
    },
    {
      id: "BT001237",
      date: "Nov 10, 2024",
      route: "HN → HP",
      status: "Completed",
      price: "$25.00",
    },
    {
      id: "BT001238",
      date: "Nov 5, 2024",
      route: "HP → HN",
      status: "Completed",
      price: "$25.00",
    },
  ],
};

const mobileMenuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/user" },
  { icon: Ticket, label: "My Bookings", href: "/user/bookings" },
  { icon: CreditCard, label: "Payment", href: "/user/payment" },
  { icon: User, label: "Profile", href: "/user/profile" },
  { icon: Bell, label: "Notifications", href: "/user/notifications" },
  { icon: HelpCircle, label: "Help & Support", href: "/user/help" },
];

export default function UserDashboard() {
  return (
    <div className="flex bg-background min-h-screen">
      {/* Sidebar - Desktop only */}
      <UserSidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile Navigation Dropdown */}
        <MobileNavDropdown menuItems={mobileMenuItems} title="User Dashboard" />

        {/* Content Area */}
        <main className="flex-1 pt-4 px-4">
          <div className="flex flex-col xl:flex-row gap-2">
            {/* Main Content - Full width on mobile, 2/3 on desktop */}
            <div className="flex-1 xl:w-2/3 space-y-2">
              {/* Top Section - Stats Cards */}
              <div className="bg-card/80 dark:bg-black/90 rounded-md p-4 md:p-6 shadow-sm border border-border backdrop-blur-sm">
                <h2 className="text-h2 text-card-foreground mb-6">
                  My Travel Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  {userDashboardData.stats.map((stat, index) => (
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

              {/* Trip Summary Panel */}
              <div className="bg-card/80 dark:bg-black/90 rounded-md p-4 md:p-6 shadow-sm border border-border backdrop-blur-sm">
                <h2 className="text-h2 text-card-foreground mb-6">
                  Upcoming Trips
                </h2>
                <div className="space-y-4">
                  {userDashboardData.upcomingTrips.map((trip, index) => (
                    <div
                      key={trip.bookingId}
                      className="bg-card rounded-lg p-4 md:p-6 shadow-sm border border-border"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Trip Route */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            <div className="flex-1 h-0.5 bg-border"></div>
                            <div className="w-3 h-3 bg-accent rounded-full"></div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span>Departure</span>
                            <span>Arrival</span>
                          </div>
                          <h3 className="text-h3 text-foreground mb-2">
                            {trip.route}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{trip.departureTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>to {trip.arrivalTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Trip Details */}
                        <div className="lg:w-1/3 space-y-3">
                          <div className="flex items-center gap-2">
                            <Bus className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {trip.busName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              Seat: <strong>{trip.seatNumber}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Booking ID:
                            </span>
                            <span className="text-xs font-mono">
                              {trip.bookingId}
                            </span>
                          </div>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              trip.status === "Confirmed"
                                ? "bg-accent/20 text-accent dark:bg-accent/30 dark:text-accent"
                                : trip.status === "Pending"
                                  ? "bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {trip.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-card/80 dark:bg-black/90 rounded-md p-4 md:p-6 shadow-sm border border-border backdrop-blur-sm">
                <h2 className="text-h2 text-card-foreground mb-6">
                  Recent Bookings
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">
                          Booking ID
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold hidden sm:table-cell">
                          Route
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">
                          Price
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDashboardData.recentBookings.map(
                        (booking, index) => (
                          <tr
                            key={booking.id}
                            className={`border-b border-border hover:bg-muted/50 transition-colors ${
                              index % 2 === 0 ? "bg-card/60" : "bg-muted/60"
                            }`}
                          >
                            <td className="py-4 px-4 text-foreground font-mono text-xs">
                              {booking.id}
                            </td>
                            <td className="py-4 px-4 text-foreground">
                              {booking.date}
                            </td>
                            <td className="py-4 px-4 text-foreground hidden sm:table-cell">
                              {booking.route}
                            </td>
                            <td className="py-4 px-4 text-foreground font-medium">
                              {booking.price}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  booking.status === "Confirmed"
                                    ? "bg-accent/10 text-accent dark:bg-accent/30 dark:text-accent"
                                    : booking.status === "Completed"
                                      ? "bg-primary/10 text-primary dark:bg-primary/30 dark:text-primary"
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
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Quick Actions and Information */}
            <div className="w-full xl:w-1/3 bg-card/80 dark:bg-black/90 rounded-md p-4 md:p-6 shadow-sm border border-border backdrop-blur-sm">
              <div className="space-y-4">
                {/* Quick Actions Card */}
                <div className="bg-card/80 rounded-lg p-4 shadow-sm border border-border backdrop-blur-sm">
                  <h3 className="text-h3 text-card-foreground mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity">
                      Book New Ticket
                    </button>
                    <button className="w-full bg-card border border-border text-foreground py-3 px-4 rounded-lg font-medium hover:bg-muted transition-colors">
                      View All Bookings
                    </button>
                    <button className="w-full bg-card border border-border text-foreground py-3 px-4 rounded-lg font-medium hover:bg-muted transition-colors">
                      Download Tickets
                    </button>
                  </div>
                </div>

                {/* Travel Tips Card */}
                <div className="bg-card/80 rounded-lg p-4 shadow-sm border border-border backdrop-blur-sm">
                  <h3 className="text-h3 text-card-foreground mb-4">
                    Travel Tips
                  </h3>
                  <div className="space-y-3 text-caption">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-primary font-medium">
                        Arrive 15 minutes early
                      </p>
                      <p className="text-primary/80 text-xs mt-1">
                        Please arrive at the station 15 minutes before departure
                        time.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-green-700 font-medium">
                        Mobile tickets accepted
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        Show your e-ticket on your mobile device to the driver.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Support Card */}
                <div className="bg-card/80 rounded-lg p-4 shadow-sm border border-border backdrop-blur-sm">
                  <h3 className="text-h3 text-card-foreground mb-4">
                    Need Help?
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted transition-colors text-caption">
                      📞 Customer Support
                    </button>
                    <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted transition-colors text-caption">
                      💬 Live Chat
                    </button>
                    <button className="w-full text-left py-2 px-3 rounded-lg hover:bg-muted transition-colors text-caption">
                      📧 Email Support
                    </button>
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
