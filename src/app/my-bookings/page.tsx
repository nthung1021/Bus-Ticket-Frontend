"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyBookingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new route
    router.replace('/user/bookings');
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to your bookings...</p>
      </div>
    </div>
  );
}