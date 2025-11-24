"use client";

import { Bell, Settings, User, LogOut, UserCircle, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ui/ThemeToggle";
import styles from "./UserHeader.module.css";

export function UserHeader() {
  return (
    <header className={styles.header}>
      <h1 className={`${styles.title} text-h3`}>My Travel Dashboard</h1>

      <div className={styles.actionsContainer}>
        <button className={styles.notificationButton}>
          <Bell className={styles.notificationIcon} />
          <span className={styles.notificationBadge}></span>
        </button>

        <ThemeToggle />

        <button className={styles.iconButton}>
          <Ticket className={styles.icon} />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={styles.userButton}>
              <User className={styles.icon} />
              <span className={styles.userName}>John Doe</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={styles.dropdownContent} align="end">
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Ticket className="mr-2 h-4 w-4" />
              <span>My Tickets</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
