"use client";

import {
  LayoutDashboard,
  Route,
  Truck,
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
  { icon: Truck, label: "Manage Trips", href: "/admin/trips" },
  { icon: Ticket, label: "Manage Tickets", href: "/admin/tickets" },
  { icon: Users, label: "Manage Passengers", href: "/admin/passengers" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarClasses = cn(
    styles.sidebar,
    isOpen && "!flex lg:!flex", // Show mobile sidebar when open
    !isOpen && "hidden lg:flex" // Hide mobile sidebar when closed, show desktop always
  );

  const handleLinkClick = () => {
    // Close mobile menu when link is clicked
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside className={sidebarClasses}>
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
                onClick={handleLinkClick}
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
    </>
  );
}
