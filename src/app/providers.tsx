"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ThemeProvider } from "src/components/ThemeProvider";
import { SeatProvider } from "@/contexts/seat-context";
import { BookingProvider } from "@/contexts/booking-context";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SeatProvider>
          <BookingProvider>
            <Toaster />
            {children}
          </BookingProvider>
        </SeatProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
