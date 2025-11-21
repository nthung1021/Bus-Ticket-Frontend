import type React from "react"
import { ArrowUpRight } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  subtitle: string
  icon?: React.ReactNode
  trend?: number
  trendLabel?: string
  bgColor?: string
}

export function StatCard({ title, value, subtitle, icon, trend, trendLabel, bgColor = "bg-blue-500" }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-border overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mt-2">{value}</h3>
          <p className="text-muted-foreground text-xs mt-2">{subtitle}</p>
        </div>
        {icon && (
          <div className={`${bgColor} rounded-lg p-2 md:p-3 text-white flex-shrink-0`}>
            <div className="w-4 h-4">
              {icon}
            </div>
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-4">
          <ArrowUpRight className="w-4 h-4 text-accent" />
          <span className="text-accent text-xs font-semibold">{trend}%</span>
          <span className="text-muted-foreground text-xs">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}