"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, ChevronDown, Moon, Sun } from "lucide-react";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface MobileNavDropdownProps {
  menuItems: MenuItem[];
  title: string;
}

export function MobileNavDropdown({ menuItems, title }: MobileNavDropdownProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="lg:hidden p-4 border-b border-border bg-background/98 backdrop-blur-md sticky top-16 z-[55] shadow-sm">
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger className="flex items-center justify-between w-full text-foreground hover:text-primary transition-colors p-2 rounded-md hover:bg-muted/50">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-medium">{title}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 mt-2 shadow-lg">
          <DropdownMenuLabel className="text-sm font-medium text-muted-foreground px-2 py-1">
            Navigation
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link 
                  href={item.href}
                  className={`cursor-pointer flex items-center space-x-3 px-2 py-2 ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => setDropdownOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center space-x-3 cursor-pointer px-2 py-2"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}