import type React from "react";
import { ArrowUpRight } from "lucide-react";
import styles from "./StatCard.module.css";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  bgColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  bgColor = "bg-primary",
}: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <div className={styles.textContent}>
          <p className={`${styles.title} text-caption`}>{title}</p>
          <h3 className={`${styles.value} text-h3`}>{value}</h3>
          <p className={`${styles.subtitle} text-caption`}>{subtitle}</p>
        </div>
        {icon && (
          <div className={cn(styles.iconContainer, bgColor)}>
            <div className={styles.iconWrapper}>{icon}</div>
          </div>
        )}
      </div>
      {trend && (
        <div className={styles.trendContainer}>
          <ArrowUpRight className={styles.trendIcon} />
          <span className={`${styles.trendValue} text-caption`}>{trend}%</span>
          <span className={`${styles.trendLabel} text-caption`}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}
