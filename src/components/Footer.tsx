"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const pathname = usePathname();
  
  // Check if current page is a dashboard page
  const isDashboardPage = pathname?.startsWith('/user') || pathname?.startsWith('/admin');

  // Background images for automatic transition
  const backgroundImages = [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop", // Bus on highway
    "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1470&auto=format&fit=crop", // City skyline
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1470&auto=format&fit=crop", // Mountain road
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1470&auto=format&fit=crop", // Coastal highway
  ];

  // Auto-change background every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <footer className={`relative overflow-hidden ${isDashboardPage ? 'lg:ml-64 lg:w-auto' : ''}`}>
      {/* Background Images with Transitions */}
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
            }}
          />
        ))}
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />
        {/* Theme-aware gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
      </div>

      {/* Footer Content */}
      <div className="relative z-40">
        {/* Main Footer Section */}
        <div className="bg-card/95 dark:bg-card/90 backdrop-blur-md border-t border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-h4 font-bold text-foreground mb-4">BusTickets</h3>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    Your trusted partner for comfortable and reliable bus travel across the country. 
                    Book with confidence and travel with ease.
                  </p>
                </div>
                <div className="flex space-x-4">
                  {/* Social Media Icons */}
                  <Button size="icon" variant="outline" className="bg-background/50 hover:bg-primary hover:text-primary-foreground">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </Button>
                  <Button size="icon" variant="outline" className="bg-background/50 hover:bg-primary hover:text-primary-foreground">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </Button>
                  <Button size="icon" variant="outline" className="bg-background/50 hover:bg-primary hover:text-primary-foreground">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.748.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.599 2.282-.744 2.84-.282 1.084-1.064 2.456-1.549 3.235C9.584 23.815 10.77 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </Button>
                  <Button size="icon" variant="outline" className="bg-background/50 hover:bg-primary hover:text-primary-foreground">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-6">
                <h4 className="text-h5 font-semibold text-foreground">Quick Links</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/routes" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Find Routes
                    </Link>
                  </li>
                  <li>
                    <Link href="/tickets" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      My Tickets
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Contact Support
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div className="space-y-6">
                <h4 className="text-h5 font-semibold text-foreground">Services</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="/bus-booking" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Bus Booking
                    </Link>
                  </li>
                  <li>
                    <Link href="/schedule" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Bus Schedule
                    </Link>
                  </li>
                  <li>
                    <Link href="/tracking" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Live Tracking
                    </Link>
                  </li>
                  <li>
                    <Link href="/cancellation" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Cancellation
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund" className="text-body text-muted-foreground hover:text-foreground transition-colors">
                      Refund Policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Newsletter */}
              <div className="space-y-6">
                <h4 className="text-h5 font-semibold text-foreground">Stay Updated</h4>
                <p className="text-body text-muted-foreground">
                  Subscribe to our newsletter for latest offers and travel updates.
                </p>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-background/80 backdrop-blur-sm border-border/60 focus:border-primary"
                  />
                  <Button className="w-full cursor-pointer" size="lg">
                    Subscribe
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-h6 font-medium text-foreground">Download Our App</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary hover:text-primary-foreground">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      App Store
                    </Button>
                    <Button variant="outline" size="sm" className="bg-background/50 hover:bg-primary hover:text-primary-foreground">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.699 12l1.999-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/>
                      </svg>
                      Play Store
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="bg-background/95 dark:bg-background/90 backdrop-blur-md border-t border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <p className="text-caption text-muted-foreground">
                  © 2025 BusTickets. All rights reserved.
                </p>
                <div className="flex items-center space-x-4">
                  <Link href="/privacy" className="text-caption text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link href="/terms" className="text-caption text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <Link href="/cookies" className="text-caption text-muted-foreground hover:text-foreground transition-colors">
                    Cookie Policy
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-caption text-muted-foreground">
                <span>Made with ❤️ in Vietnam</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;