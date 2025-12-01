"use client";

import {
  LayoutDashboard,
  Ticket,
  CreditCard,
  User,
  Bell,
  HelpCircle,
  Bus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from "./UserSidebar.module.css";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/user" },
  { icon: Ticket, label: "My Bookings", href: "/user/bookings" },
  { icon: CreditCard, label: "Payment", href: "/user/payment" },
  { icon: User, label: "Profile", href: "/user/profile" },
  { icon: Bell, label: "Notifications", href: "/user/notifications" },
  { icon: HelpCircle, label: "Help & Support", href: "/user/help" },
];

interface UserSidebarProps {
  // No props needed for desktop-only sidebar
}

export function UserSidebar({}: UserSidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} hidden lg:flex`}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logoWrapper}>
            <div className={styles.logoIcon}>
              <Bus className={styles.logoIconSvg} />
            </div>
            <span className={`${styles.logoText} text-h5`}>BusTicket</span>
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
                    isActive ? styles.menuItemActive : styles.menuItemInactive
                  )}
                >
                  <div className={styles.menuItemContent}>
                    <Icon
                      className={cn(
                        styles.menuItemIcon,
                        isActive
                          ? styles.menuItemIconActive
                          : styles.menuItemIconInactive
                      )}
                    />
                    <span className={styles.menuItemText}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerContent}>
            <p className={`${styles.footerText} text-body`}>
              Safe travels with us!
            </p>
            <p className={`${styles.footerCopyright} text-caption`}>
              © {new Date().getFullYear().toString()}
            </p>
          </div>
        </div>
      </aside>
  );
}
