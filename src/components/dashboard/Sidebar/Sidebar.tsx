"use client";

import {
  LayoutDashboard,
  Route,
  Truck,
  Bus,
  Users,
  Ticket,
  FileText,
  Settings,
  Zap,
  Building,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import styles from "./Sidebar.module.css";
import { useState, useEffect } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Route, label: "Manage Routes", href: "/admin/routes" },
  { icon: Bus, label: "Manage Buses", href: "/admin/buses" },
  { icon: Truck, label: "Manage Trips", href: "/admin/trips" },
  { icon: Building, label: "Manage Operators", href: "/admin/operators" },
  { icon: Users, label: "Manage Passengers", href: "/admin/passengers" },
  { icon: Ticket, label: "Manage Tickets", href: "/admin/tickets" },
  { icon: FileText, label: "Manage FAQs", href: "/admin/faqs" },
  { icon: BarChart3, label: "Revenue Analytics", href: "/admin/analytics/revenue" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps = {}) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`${styles.sidebar} hidden lg:flex`}>
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

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={handleLinkClick}
          />
          {/* Mobile Menu */}
          <aside className="fixed left-0 top-0 w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col z-50 lg:hidden overflow-y-auto">
            {/* Close Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={handleLinkClick}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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

            {/* Footer */}
            <div className={`${styles.footer} text-caption`}>
              Copyright {new Date().getFullYear().toString()}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
