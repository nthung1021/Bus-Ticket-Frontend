"use client";

import { UserSidebar } from "@/components/dashboard/UserSidebar/UserSidebar";
import { MobileNavDropdown } from "@/components/dashboard/MobileNavDropdown/MobileNavDropdown";
import { UserHeader } from "@/components/dashboard/UserHeader/UserHeader";
import { StatCard } from "@/components/dashboard/StatCard/StatCard";
import { MyBookings } from "@/components/dashboard/MyBookings/MyBookings";
import { useDashboardData } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { Clock, Ticket, DollarSign, MapPin, Bus, Calendar, LayoutDashboard, CreditCard, User, Bell, HelpCircle, RefreshCw } from "lucide-react";

const mobileMenuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/user" },
  { icon: Ticket, label: "My Bookings", href: "/user/bookings" },
  { icon: CreditCard, label: "Payment", href: "/user/payment" },
  { icon: User, label: "Profile", href: "/user/profile" },
  { icon: Bell, label: "Notifications", href: "/user/notifications" },
  { icon: HelpCircle, label: "Help & Support", href: "/user/help" },
];

export default function UserDashboard() {
  const { loading, error, stats, upcomingTrips, formatShortCurrency } = useDashboardData();

  // Generate stats cards with real data
  const statsCards = [
    {
      title: "Upcoming Trips",
      value: loading ? "..." : stats.upcomingTrips.toString(),
      subtitle: stats.nextTripDate ? `Next: ${stats.nextTripDate}` : "No upcoming trips",
      icon: <Clock className="w-6 h-6" />,
      bgColor: "bg-primary",
    },
    {
      title: "Total Tickets",
      value: loading ? "..." : stats.totalTickets.toString(),
      subtitle: "This year",
      icon: <Ticket className="w-6 h-6" />,
      bgColor: "bg-accent",
    },
    {
      title: "Total Spent",
      value: loading ? "..." : formatShortCurrency(stats.totalSpent),
      subtitle: "This year",
      icon: <DollarSign className="w-6 h-6" />,
      bgColor: "bg-secondary",
    },
  ];

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
                
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6">
                    <p className="text-destructive text-sm">
                      <strong>Error loading dashboard data:</strong> {error}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  {statsCards.map((stat, index) => (
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
                
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading trips...</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="text-center py-12">
                    <p className="text-destructive mb-4">{error}</p>
                  </div>
                )}
                
                {!loading && !error && upcomingTrips.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-h3 font-medium mb-2">No upcoming trips</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any confirmed trips scheduled.
                    </p>
                    <button 
                      onClick={() => window.location.href = '/search'}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Book a Trip
                    </button>
                  </div>
                )}
                
                {!loading && !error && upcomingTrips.length > 0 && (
                  <div className="space-y-4">
                    {upcomingTrips.map((trip) => (
                      <div
                        key={trip.id}
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
                                <span>
                                  {trip.departureTime ? format(new Date(trip.departureTime), 'PPp') : 'Time TBA'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>
                                  to {trip.arrivalTime ? format(new Date(trip.arrivalTime), 'HH:mm') : 'TBA'}
                                </span>
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
                                Seats: <strong>{trip.seatCodes.join(', ')}</strong>
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
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                              {trip.status === 'paid' ? 'Confirmed' : trip.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Bookings Section */}
              <MyBookings 
                isSection={true} 
                maxItems={3} 
                showFilters={false} 
              />
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
                    <button 
                      onClick={() => window.location.href = '/search'}
                      className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      Book New Ticket
                    </button>
                    <button 
                      onClick={() => window.location.href = '/user/bookings'}
                      className="w-full bg-card border border-border text-foreground py-3 px-4 rounded-lg font-medium hover:bg-muted transition-colors"
                    >
                      View All Bookings
                      {!loading && stats.totalTickets > 0 && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          {stats.totalTickets}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => window.location.href = '/user/bookings?filter=paid'}
                      className="w-full bg-card border border-border text-foreground py-3 px-4 rounded-lg font-medium hover:bg-muted transition-colors"
                      disabled={loading || stats.upcomingTrips === 0}
                    >
                      Download Tickets
                      {stats.upcomingTrips > 0 && (
                        <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                          {stats.upcomingTrips}
                        </span>
                      )}
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
