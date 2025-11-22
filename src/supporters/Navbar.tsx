"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "src/supporters/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-desktop">
        <div className="navbar-desktop-content">
          <Link href="/" className="navbar-desktop-brand">
            Bus Ticket App
          </Link>

          {/* Center menu */}
          <ul className="navbar-desktop-links">
            <li><a href="#">About</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Blog</a></li>
          </ul>

          {/* RIGHT SIDE — Conditional rendering */}
          <div className="navbar-desktop-actions">
            {!user ? (
              <>
                <Link href="/login" className="btn-secondary">
                  Login
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <span>
                  Hello, {user.name} ({user.role.toUpperCase()})
                </span>
                {user.role === 'admin' && 
                  <Link className="btn-primary" href="/admin/manage-users">
                    Admin
                  </Link>
                }
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <button
            className="md:hidden text-teal-900"
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="navbar-mobile">
          <div className="navbar-mobile-menu">            

            <ul className="navbar-mobile-links">
              <li><a href="#">About</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Blog</a></li>
            </ul>

            {!user ? (
              <>
                <Link href="/login" className="btn-secondary">
                  Login
                </Link>
                <Link href="/register" className="btn-primary">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <span className="navbar-mobile-username">
                  Hello, {user.name} ({user.role.toUpperCase()})
                </span>
                {user.role === 'admin' && 
                  <Link className="btn-primary" href="/admin/manage-users">
                    Admin
                  </Link>
                }
                <button
                  className="btn-secondary"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
