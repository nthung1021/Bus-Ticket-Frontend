"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useCurrentUser, useLogout } from "src/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error("Server logout failed:", e);
    }
  };

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-h6 font-bold text-foreground">
            BusTickets
          </Link>

          {/* Center menu */}
          <ul className="hidden md:flex items-center space-x-8">
            <li>
              <Link href="/" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li>
              <a href="#" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                Routes
              </a>
            </li>
            <li>
              <a href="/tickets" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                Tickets
              </a>
            </li>
            <li>
              <a href="#" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="#" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </li>
          </ul>

          {/* RIGHT SIDE — Conditional rendering */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link 
                  href="/login" 
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                {user?.role === "admin" && (
                  <Link 
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors" 
                    href="/admin"
                  >
                    Admin
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 p-2 rounded-full hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{user?.fullName}</span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {user?.role === 'customer' ? 'CUSTOMER' : user?.role?.toUpperCase()}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/user" className="cursor-pointer">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/user/bookings" className="cursor-pointer">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/user/settings" className="cursor-pointer">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="cursor-pointer"
                    >
                      {theme === 'dark' ? (
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive hover:text-destructive"
                      disabled={(logoutMutation as any).isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {(logoutMutation as any).isLoading ? 'Logging out...' : 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-muted/50 transition-colors text-foreground"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-card/98 backdrop-blur-md border-t border-border shadow-lg">
          <div className="px-4 sm:px-6 py-4 space-y-4">
            <ul className="space-y-2">
              <li>
                <Link href="/" className="block text-body text-muted-foreground hover:text-foreground transition-colors py-2">
                  Home
                </Link>
              </li>
              <li>
                <a href="#" className="block text-body text-muted-foreground hover:text-foreground transition-colors py-2">
                  Routes
                </a>
              </li>
              <li>
                <a href="#" className="block text-body text-muted-foreground hover:text-foreground transition-colors py-2">
                  Tickets
                </a>
              </li>
              <li>
                <a href="#" className="block text-body text-muted-foreground hover:text-foreground transition-colors py-2">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="block text-body text-muted-foreground hover:text-foreground transition-colors py-2">
                  Contact
                </a>
              </li>
            </ul>

            <div className="space-y-3 pt-4 border-t border-border">
              {!user ? (
                <>
                  <Link 
                    href="/login" 
                    className="block bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors text-center"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-center"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 py-3 border-b border-border/50 bg-muted/20 rounded-lg px-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{user?.fullName}</div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {user?.role === 'customer' ? 'CUSTOMER' : user?.role?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link 
                      href="/user"
                      className="flex items-center space-x-3 text-body text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors py-2 px-2 rounded-md cursor-pointer"
                      onClick={() => setOpen(false)}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </Link>
                    
                    <Link 
                      href="/user/bookings"
                      className="flex items-center space-x-3 text-body text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors py-2 px-2 rounded-md cursor-pointer"
                      onClick={() => setOpen(false)}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>My Bookings</span>
                    </Link>
                    
                    <Link 
                      href="/user/settings"
                      className="flex items-center space-x-3 text-body text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors py-2 px-2 rounded-md cursor-pointer"
                      onClick={() => setOpen(false)}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Settings</span>
                    </Link>
                    
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="flex items-center space-x-3 text-body text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors py-2 px-2 rounded-md cursor-pointer w-full text-left"
                    >
                      {theme === 'dark' ? (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                  </div>

                  {user?.role === "admin" && (
                    <Link 
                      className="block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-center" 
                      href="/admin"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <button 
                    className="flex items-center justify-center space-x-2 w-full bg-destructive/10 text-destructive px-4 py-2 rounded-lg hover:bg-destructive/20 transition-colors" 
                    onClick={handleLogout} 
                    disabled={(logoutMutation as any).isLoading}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{(logoutMutation as any).isLoading ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
