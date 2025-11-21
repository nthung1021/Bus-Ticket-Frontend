"use client"

import { LayoutDashboard, Route, Truck, Ticket, Users, FileText, Settings, Zap } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Route, label: "Manage Routes", href: "/admin/routes" },
  { icon: Truck, label: "Manage Trips", href: "/admin/trips" },
  { icon: Ticket, label: "Manage Tickets", href: "/admin/tickets" },
  { icon: Users, label: "Manage Passengers", href: "/admin/passengers" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground">Bus Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Quick Actions Button */}
      <div className="p-4 border-t border-sidebar-border">
        <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
          <Zap className="w-4 h-4 inline mr-2" />
          Quick Actions
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 text-xs text-sidebar-foreground/60 border-t border-sidebar-border">
        Copyright {new Date().getFullYear().toString()}
      </div>
    </aside>
  )
}