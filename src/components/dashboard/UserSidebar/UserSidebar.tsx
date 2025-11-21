"use client"

import { 
  LayoutDashboard, 
  Ticket, 
  CreditCard, 
  User, 
  Bell, 
  HelpCircle, 
  Bus 
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import styles from "./UserSidebar.module.css"

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/user" },
  { icon: Ticket, label: "My Bookings", href: "/user/bookings" },
  { icon: CreditCard, label: "Payment", href: "/user/payment" },
  { icon: User, label: "Profile", href: "/user/profile" },
  { icon: Bell, label: "Notifications", href: "/user/notifications" },
  { icon: HelpCircle, label: "Help & Support", href: "/user/help" },
]

export function UserSidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <div className={styles.logoIcon}>
            <Bus className={styles.logoIconSvg} />
          </div>
          <span className={styles.logoText}>BusTicket</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        <div className={styles.menuContainer}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  styles.menuItem,
                  isActive ? styles.menuItemActive : styles.menuItemInactive
                )}
              >
                <Icon className={styles.menuIcon} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>Safe travels with us!</p>
          <p className={styles.footerCopyright}>© {new Date().getFullYear().toString()}</p>
        </div>
      </div>
    </aside>
  )
}