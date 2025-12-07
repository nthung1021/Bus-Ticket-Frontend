"use client";

import { UserSidebar } from "@/components/dashboard/UserSidebar/UserSidebar";
import { MobileNavDropdown } from "@/components/dashboard/MobileNavDropdown/MobileNavDropdown";
import { MyBookings } from "@/components/dashboard/MyBookings/MyBookings";
import { LayoutDashboard, Ticket, CreditCard, User, Bell, HelpCircle } from "lucide-react";

const mobileMenuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/user" },
  { icon: Ticket, label: "My Bookings", href: "/user/bookings" },
  { icon: CreditCard, label: "Payment", href: "/user/payment" },
  { icon: User, label: "Profile", href: "/user/profile" },
  { icon: Bell, label: "Notifications", href: "/user/notifications" },
  { icon: HelpCircle, label: "Help & Support", href: "/user/help" },
];

export default function UserBookingsPage() {
  return (
    <div className="flex bg-background min-h-screen">
      {/* Sidebar - Desktop only */}
      <UserSidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile Navigation Dropdown */}
        <MobileNavDropdown menuItems={mobileMenuItems} title="My Bookings" />

        {/* Content Area */}
        <main className="flex-1 pt-4 px-4">
          <MyBookings isSection={false} showFilters={true} />
        </main>
      </div>
    </div>
  );
}
