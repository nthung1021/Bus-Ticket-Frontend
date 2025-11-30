"use client";

import Link from "next/link";
import { useState } from "react";
import { useCurrentUser, useLogout } from "src/hooks/useAuth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error("Server logout failed:", e);
    }
  };

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
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
              <a href="#" className="text-body text-muted-foreground hover:text-foreground transition-colors">
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
              <>
                <span className="text-body text-foreground">
                  Hello, {user?.fullName} ({user?.role?.toUpperCase()})
                </span>
                {user?.role === "admin" && (
                  <Link 
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors" 
                    href="/admin"
                  >
                    Admin
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors" 
                  disabled={(logoutMutation as any).isLoading}
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-6 py-4 space-y-4">
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
                <>
                  <span className="block text-body text-foreground py-2">
                    Hello, {user?.fullName} ({user?.role?.toUpperCase()})
                  </span>
                  {user?.role === "admin" && (
                    <Link 
                      className="block bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-center" 
                      href="/admin"
                    >
                      Admin
                    </Link>
                  )}
                  <button 
                    className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors" 
                    onClick={handleLogout} 
                    disabled={(logoutMutation as any).isLoading}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
