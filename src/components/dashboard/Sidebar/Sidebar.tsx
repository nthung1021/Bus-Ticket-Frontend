"use client";

import {
  LayoutDashboard,
  Route,
  Truck,
  Bus,
  Ticket,
  Users,
  FileText,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from "./Sidebar.module.css";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Route, label: "Manage Routes", href: "/admin/routes" },
  { icon: Bus, label: "Manage Buses", href: "/admin/buses" },
  { icon: Truck, label: "Manage Trips", href: "/admin/trips" },
  { icon: Ticket, label: "Manage Tickets", href: "/admin/tickets" },
  { icon: Users, label: "Manage Passengers", href: "/admin/passengers" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <Truck className={styles.logoIconSvg} />
          </div>
          <span className={`${styles.logoText} text-h5`}>Bus Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        <div className={styles.menuContainer}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  styles.menuItem,
                  "text-body",
                  isActive ? styles.menuItemActive : styles.menuItemInactive,
                )}
              >
                <Icon className={styles.menuIcon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions Button */}
      <div className={styles.quickActionsContainer}>
        <button className={styles.quickActionsButton}>
          <Zap className={styles.quickActionsIcon} />
          Quick Actions
        </button>
      </div>

      {/* Footer */}
      <div className={`${styles.footer} text-caption`}>
        Copyright {new Date().getFullYear().toString()}
      </div>
    </aside>
  );
}
