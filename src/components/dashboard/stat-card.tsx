import type React from "react"
import { ArrowUpRight } from "lucide-react"
import styles from "./stat-card.module.css"
import { cn } from "@/lib/utils"

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
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <div className={styles.textContent}>
          <p className={styles.title}>{title}</p>
          <h3 className={styles.value}>{value}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {icon && (
          <div className={cn(styles.iconContainer, bgColor)}>
            <div className={styles.iconWrapper}>
              {icon}
            </div>
          </div>
        )}
      </div>
      {trend && (
        <div className={styles.trendContainer}>
          <ArrowUpRight className={styles.trendIcon} />
          <span className={styles.trendValue}>{trend}%</span>
          <span className={styles.trendLabel}>{trendLabel}</span>
        </div>
      )}
    </div>
  )
}
