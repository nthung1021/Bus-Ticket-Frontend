"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  CheckCircle,
  Download,
  Calendar,
  MapPin,
  Clock,
  User,
  Bus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useAuth";
import { useBookingWebSocket } from "@/hooks/useBookingWebSocket";
import { BookingStatus } from "@/services/booking-websocket.service";
import UserBookingService, {
  type Booking,
} from "@/services/userBookingService";
import { getTripById } from "@/services/trip.service";
import api from "@/lib/api";
import { formatCurrency } from "@/utils/formatCurrency";

function PaymentSuccessPageContent() {
  // console.log("hello world");
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const searchParams = useSearchParams();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailTriggered, setEmailTriggered] = useState(false);
  const [waitingConfirmation, setWaitingConfirmation] = useState(false);

  const bookingService = new UserBookingService();

  // bookingId and tripId are client-side values stored in sessionStorage as a fallback.
  // Initialize as state and populate inside useEffect to avoid server-side access errors.
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string>("");

  // WebSocket for booking management
  const {
    isConnected,
    bookings,
    getBookingStatus,
    trackBooking,
    updatePaymentStatus,
    getPaymentStatus,
  } = useBookingWebSocket({
    tripId,
    // Enable socket when we at least have bookingId so we can track specific bookings
    enabled: !!bookingId,
    userId: user?.id,
  });

  // Populate bookingId and tripId from search params or sessionStorage on client
  useEffect(() => {
    const idFromParams = searchParams.get("bookingId");
    if (idFromParams) {
      setBookingId(idFromParams);
    } else if (typeof window !== "undefined") {
      const bookingData = sessionStorage.getItem("bookingData");
      if (bookingData) {
        try {
          const parsed = JSON.parse(bookingData);
          if (parsed.bookingId) setBookingId(parsed.bookingId);
          if (parsed.tripId) setTripId(parsed.tripId);
        } catch (e) {
          console.error("Failed to parse bookingData from sessionStorage", e);
        }
      }
    }
  }, [searchParams]);

  // Prevent duplicate fetches/confirm attempts when the effect dependencies change frequently
  // Use a timestamped guard so we still refetch if user returns after a short delay
  const fetchedBookingRef = (globalThis as any).__bpf_fetchedBookingRef ||= { id: null, ts: 0 };
  const confirmCalledRef = (globalThis as any).__bpf_confirmCalledRef ||= { id: null };

  useEffect(() => {
    const fetchBooking = async () => {
      // guard: only fetch/confirm once per bookingId within a short window
      if (!bookingId) return;
      const now = Date.now();
      const lastId = fetchedBookingRef.id;
      const lastTs = fetchedBookingRef.ts || 0;
      // If we've fetched the same bookingId recently (within 30s), skip
      if (lastId === bookingId && now - lastTs < 30_000) return;
      fetchedBookingRef.id = bookingId;
      fetchedBookingRef.ts = now;
      // // Temporary: if PayOS returned success parameters, redirect straight to My Bookings
      // const payosStatus = searchParams.get('status') || searchParams.get('payos_status');
      // const payosCode = searchParams.get('code') || searchParams.get('orderCode');
      // const looksLikePaid = (payosStatus && payosStatus.toString().toLowerCase() === 'paid') || (payosCode && (payosCode === '00' || /^\d+$/.test(payosCode)));
      // if (looksLikePaid) {
      //   router.replace('/user/bookings');
      //   return;
      // }
      console.debug('PaymentSuccessPage: starting fetchBooking for', bookingId);
      try {
        setLoading(true);
        setError(null);

        if (!bookingId) {
          setError("Booking ID not found. Please check again.");
          return;
        }

        // // If PayOS returned with cancel flag, forward to cancel handler
        // const payosCancel = searchParams.get('cancel') || searchParams.get('canceled');
        // if (payosCancel && bookingId) {
        //   const params = new URLSearchParams(searchParams.toString());
        //   // ensure bookingId is a single param and set it to our value
        //   params.delete('bookingId');
        //   params.set('bookingId', bookingId);
        //   router.replace(`/payment/cancel?${params.toString()}`);
        //   return;
        // }

        // Try fetching booking directly from backend (useful when returning from PayOS)
        try {
          const resp = await api.get(`/bookings/${bookingId}`);
          console.debug('PaymentSuccessPage: GET /bookings/:id response', resp?.data);
          if (resp?.data) {
            const remoteBooking = resp.data?.data || resp.data;
            console.debug('PaymentSuccessPage: normalized remoteBooking', remoteBooking);
            // Normalize status to string
            const remoteStatus = (remoteBooking.status || '').toString().toLowerCase();
            console.debug('PaymentSuccessPage: remoteStatus', remoteStatus);
            if (remoteStatus === 'paid' || remoteStatus === 'completed') {
              // We have a confirmed paid booking from backend; show success immediately
              setBooking(remoteBooking as any);
              setLoading(false);
              return;
            }

            // Attach tripId for websocket joining
            if (remoteBooking.tripId) setTripId(remoteBooking.tripId);

            // If PayOS redirect params indicate possible success, try confirm then poll for status
            const payosStatus = searchParams.get('status') || searchParams.get('payos_status');
            const payosCode = searchParams.get('code') || searchParams.get('orderCode');
            const looksLikePaid = (payosStatus && payosStatus.toString().toLowerCase() === 'paid') || (payosCode && (payosCode === '00' || /^\d+$/.test(payosCode)));

            if (looksLikePaid) {
              try {
                const paymentData = {
                  orderCode: searchParams.get('orderCode') || undefined,
                  transactionId: searchParams.get('id') || undefined,
                  raw: Object.fromEntries(searchParams.entries()),
                };

                // Best-effort confirm call
                try {
                  if (confirmCalledRef.id !== bookingId) {
                    confirmCalledRef.id = bookingId;
                    await api.put(`/bookings/${bookingId}/confirm-payment`, paymentData);
                  } else {
                    console.debug('Confirm payment already attempted for', bookingId);
                  }
                } catch (e) {
                  console.debug('Confirm payment call (best-effort) failed:', e);
                }

                // Poll backend for up to ~20 seconds for booking to become PAID
                  // Poll backend for booking status but abort after a short timeout
                  let pollCancelled = false;
                  const abortTimer = setTimeout(() => {
                    pollCancelled = true;
                  }, 15000); // abort after 15s

                  const poll = async (attempts = 10, delayMs = 2000) => {
                    for (let i = 0; i < attempts; i++) {
                      if (pollCancelled) return false;
                      try {
                        const r = await api.get(`/bookings/${bookingId}`);
                        const b = r?.data?.data || r?.data;
                        const st = (b?.status || '').toString().toLowerCase();
                        if (st === 'paid' || st === 'completed') {
                          clearTimeout(abortTimer);
                          setBooking(b);
                          setLoading(false);
                          return true;
                        }
                      } catch (err) {
                        console.debug('Poll fetch failed:', err);
                      }
                      await new Promise((res) => setTimeout(res, delayMs));
                    }
                    return false;
                  };

                  const becamePaid = await poll(10, 2000);
                  clearTimeout(abortTimer);
                  if (becamePaid) return;
                  // Poll timed out or cancelled — show waiting UI instead of indefinite spinner
                  // Ensure we are tracking this booking via websocket so updates arrive
                  try {
                    if (bookingId) {
                      await trackBooking?.(bookingId);
                    }
                  } catch (err) {
                    console.debug('Failed to track booking for realtime updates:', err);
                  }

                  setWaitingConfirmation(true);
                  setLoading(false);
                  return;
              } catch (err) {
                console.debug('Confirm/payment+poll sequence failed:', err);
              }
            }
          }
        } catch (remoteErr) {
          // non-fatal: continue with existing logic (websocket or sessionStorage)
            console.debug('Failed to fetch booking from API on success page:', remoteErr);
        }

        // Get booking data from session storage first for initial display
        const bookingData = sessionStorage.getItem("bookingData");
        // console.log("Booking data from session: ", bookingData);
        let parsedBookingData = null;
        
        if (bookingData) {
          parsedBookingData = JSON.parse(bookingData);
          
          // Fetch trip data and attach to booking
          if (parsedBookingData.tripId) {
            try {
              const tripData = await getTripById(parsedBookingData.tripId);
              // console.log("Raw trip data:", tripData);
              
              // Convert Date objects to strings and ensure required properties to match Booking type
              const formattedTripData = {
                ...tripData,
                departureTime: tripData.departureTime instanceof Date 
                  ? tripData.departureTime.toISOString() 
                  : new Date(tripData.departureTime).toISOString(),
                arrivalTime: tripData.arrivalTime instanceof Date 
                  ? tripData.arrivalTime.toISOString() 
                  : new Date(tripData.arrivalTime).toISOString(),
                status: tripData.status.toString(),
                route: {
                  id: tripData.route?.id || '',
                  name: tripData.route?.name || '',
                  description: tripData.route?.description || '',
                  origin: (tripData as any).route?.origin || '',
                  destination: (tripData as any).route?.destination || '',
                  distanceKm: (tripData as any).route?.distanceKm || 0, // Calculate from route points if available
                  estimatedMinutes: (tripData as any).route?.estimatedMinutes || 0, // Calculate from route points if available
                },
                bus: tripData.bus || {
                  id: '',
                  plateNumber: '',
                  model: '',
                  seatCapacity: 0,
                },
              };
              parsedBookingData.trip = formattedTripData;
            } catch (tripError) {
              console.error("Error fetching trip data:", tripError);
              // Continue with booking data even if trip fetch fails
            }
          }
          
          setBooking(parsedBookingData);
          console.debug('PaymentSuccessPage: loaded booking from sessionStorage', parsedBookingData);

          // If we have a bookingId but no tripId, attempt to track this booking directly
          if (bookingId && !tripId) {
            try {
              await trackBooking?.(bookingId);
            } catch (err) {
              console.debug('Failed to track booking after loading session data:', err);
            }
          }
          // console.log("Booking after getting info from session storage:", booking)
        }

          // Get real-time booking status from WebSocket
          if (isConnected) {
          // console.log("Bookings: ", bookings)
          const bookingStatus = getBookingStatus(bookingId);
          const paymentStatus = getPaymentStatus(bookingId);

          if (!bookingStatus) {
            setError("Booking not found or not being tracked.");
            return;
          }

          // Check if payment was successful
          if (bookingStatus !== BookingStatus.PAID) {
            setError(
              "Payment not successful. Please try again or contact support."
            );
            return;
          }

          // Update booking with real-time data if available
          if (bookings.has(bookingId)) {
            const realTimeBooking = bookings.get(bookingId);
            if (realTimeBooking) {
              // Fetch trip data if not already present
              let tripData = parsedBookingData?.trip;
              if (!tripData && (realTimeBooking as any).tripId) {
                try {
                  const tripDataRaw = await getTripById((realTimeBooking as any).tripId);
                  // Convert Date objects to strings and ensure required properties to match Booking type
                  tripData = {
                    ...tripDataRaw,
                    departureTime: tripDataRaw.departureTime instanceof Date 
                      ? tripDataRaw.departureTime.toISOString() 
                      : new Date(tripDataRaw.departureTime).toISOString(),
                    arrivalTime: tripDataRaw.arrivalTime instanceof Date 
                      ? tripDataRaw.arrivalTime.toISOString() 
                      : new Date(tripDataRaw.arrivalTime).toISOString(),
                    status: tripDataRaw.status.toString(),
                    route: {
                      id: tripDataRaw.route?.id || '',
                      name: tripDataRaw.route?.name || '',
                      description: tripDataRaw.route?.description || '',
                      origin: tripDataRaw.route?.points?.[0]?.name || '',
                      destination: tripDataRaw.route?.points?.[tripDataRaw.route.points.length - 1]?.name || '',
                      distanceKm: 0, // Calculate from route points if available
                      estimatedMinutes: 0, // Calculate from route points if available
                    },
                    bus: tripDataRaw.bus || {
                      id: '',
                      plateNumber: '',
                      model: '',
                      seatCapacity: 0,
                    },
                  };
                } catch (tripError) {
                  console.error("Error fetching trip data:", tripError);
                }
              }
              
              setBooking((prev: any) =>
                prev
                  ? {
                      ...prev,
                      ...realTimeBooking,
                      trip: tripData || prev.trip,
                      status:
                        bookingStatus === BookingStatus.PAID
                          ? "paid"
                          : bookingStatus,
                      bookedAt:
                        typeof realTimeBooking.bookedAt === "string"
                          ? realTimeBooking.bookedAt
                          : realTimeBooking.bookedAt?.toISOString() ||
                            prev.bookedAt,
                    }
                  : null
              );
            }
          }
          } else {
            // Fallback to session storage data if WebSocket not connected
            if (!bookingData) {
              setError("Booking information not found. Please check again.");
              return;
            }

            if (parsedBookingData.status !== "paid") {
              // Check query params from PayOS as a hint (e.g., status=PAID or code=00)
              const payosStatus = searchParams.get('status') || searchParams.get('payos_status');
              const payosCode = searchParams.get('code') || searchParams.get('orderCode');
              const payosCancel = searchParams.get('cancel');

              if ((payosStatus && payosStatus.toLowerCase() === 'paid') || (payosCode && payosCode === '00') || (payosCancel === 'false' && payosStatus && payosStatus.toLowerCase() === 'paid')) {
                // Attempt a final fetch (best-effort) to update booking state
                try {
                  const resp2 = await api.get(`/bookings/${bookingId}`);
                  if (resp2?.data && (resp2.data.status || '').toString().toLowerCase() === 'paid') {
                    setBooking(resp2.data as any);
                    setError(null);
                    return;
                  }
                } catch (err2) {
                  console.debug('Final booking fetch failed:', err2);
                }
              }

              setError("Payment not successful");
              return;
            }
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An error occurred while loading booking information"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, isConnected, bookings, getBookingStatus, getPaymentStatus, trackBooking]);

  // // Add real-time booking updates effect
  // useEffect(() => {
  //   if (!bookingId || !isConnected) return;

  //   // Listen for booking updates in real-time
  //   const interval = setInterval(async () => {
  //     const bookingStatus = getBookingStatus(bookingId);
  //     // console.log("Booking status: ", bookingStatus);
  //     const paymentStatus = getPaymentStatus(bookingId);

  //     if (bookingStatus && bookings.has(bookingId)) {
  //       const realTimeBooking = bookings.get(bookingId);
  //       // console.log("Real time booking: ", realTimeBooking)
  //       if (realTimeBooking) {
  //         // Fetch trip data if not already present
  //         let tripData = booking?.trip;
  //         if (!tripData && (realTimeBooking as any).tripId) {
  //           try {
  //             const tripDataRaw = await getTripById((realTimeBooking as any).tripId);
  //             // console.log("Trip data:", tripDataRaw)
  //             // Convert Date objects to strings and ensure required properties to match Booking type
  //             tripData = {
  //               ...tripDataRaw,
  //               departureTime: tripDataRaw.departureTime instanceof Date 
  //                 ? tripDataRaw.departureTime.toISOString() 
  //                 : new Date(tripDataRaw.departureTime).toISOString(),
  //               arrivalTime: tripDataRaw.arrivalTime instanceof Date 
  //                 ? tripDataRaw.arrivalTime.toISOString() 
  //                 : new Date(tripDataRaw.arrivalTime).toISOString(),
  //               status: tripDataRaw.status.toString(),
  //               route: {
  //                 id: tripDataRaw.route?.id || '',
  //                 name: tripDataRaw.route?.name || '',
  //                 description: tripDataRaw.route?.description || '',
  //                 origin: (tripDataRaw as any).route?.origin || '',
  //                 destination: (tripDataRaw as any).route?.destination || '',
  //                 distanceKm: (tripDataRaw as any).route?.distanceKm || 0, // Calculate from route points if available
  //                 estimatedMinutes: (tripDataRaw as any).route?.estimatedMinutes || 0, // Calculate from route points if available
  //               },
  //               bus: tripDataRaw.bus || {
  //                 id: '',
  //                 plateNumber: '',
  //                 model: '',
  //                 seatCapacity: 0,
  //               },
  //             };
  //           } catch (tripError) {
  //             console.error("Error fetching trip data:", tripError);
  //           }
  //         }
  //         console.log("Trip data:", tripData);
  //         setBooking((prev: any) => {
  //             const updatedBooking = {
  //               ...prev,
  //               ...realTimeBooking,
  //               trip: tripData,
  //               status:
  //                 bookingStatus === BookingStatus.PAID
  //                   ? "paid"
  //                   : bookingStatus,
  //               bookedAt:
  //                 typeof realTimeBooking.bookedAt === "string"
  //                   ? realTimeBooking.bookedAt
  //                   : realTimeBooking.bookedAt?.toISOString() ||
  //                     prev.bookedAt,
  //             };
              
  //             return updatedBooking;
  //           });
  //         console.log("Updated booking: ", booking);
  //       }
  //     }
  //   }, 2000); // Check every 2 seconds

  //   return () => clearInterval(interval);
  // }, [bookingId, isConnected, bookings, getBookingStatus, getPaymentStatus, booking?.trip, trackBooking]);

  useEffect(() => {
    const sendEticketEmail = async () => {
      console.log(booking);
      
      if (!booking || !(booking as any)?.bookingId) return;

      // Skip mock bookings
      if ((booking as any)?.bookingId.startsWith("mock-booking-")) return;

      // Avoid sending multiple times if state changes
      if (emailTriggered) return;

      try {
        // console.log("Triggering e-ticket email for booking", (booking as any)?.bookingId);
        await api.post(`/bookings/${(booking as any)?.bookingId}/eticket/email`, {});
        setEmailTriggered(true);
        console.log("E-ticket email triggered for booking", (booking as any)?.bookingId);
      } catch (err) {
        console.error("Failed to send e-ticket email:", err);
      }
    };

    sendEticketEmail();
  }, [booking, emailTriggered]);

  // Clear payment retry state when payment is successful
  useEffect(() => {
    if (booking && booking.status === "paid") {
      setError(null);
      // Clear retry state from sessionStorage
      sessionStorage.removeItem("paymentRetryState");
      console.log("Payment successful, cleared retry state");
    }
  }, [booking]);

  // Redirect to bookings page if no booking data
  // useEffect(() => {
  //   // Do not auto-redirect when booking not found — allow user to see failure UI
  //   // and decide next action (view bookings, contact support, etc.).
  //   // if (!booking && !loading) {
  //   //   router.push("/user/bookings");
  //   // }
  //   // console.log(booking);
  // }, [booking, loading, router]);

  // Download e-ticket
  const handleDownloadTicket = async () => {
    if (!booking) return;

    // For mock bookings, keep existing simple text-based ticket behavior
    if ((booking as any)?.bookingId.startsWith("mock-booking-")) {
      const ticketContent = `
=== BUS TICKET ===
Booking ID: ${(booking as any)?.bookingId}
Status: PAID
Route: ${booking.trip?.route?.origin} → ${booking.trip?.route?.destination}
Date: ${booking.trip?.departureTime ? format(new Date(booking.trip.departureTime), "PPP") : "N/A"}
Time: ${booking.trip?.departureTime ? format(new Date(booking.trip.departureTime), "p") : "N/A"}
Bus: ${booking.trip?.bus?.plateNumber || "N/A"}
Passengers: ${booking.passengers?.map((p: any) => `${p.fullName} (Seat ${p.seatCode})`).join(", ")}
Total Amount: ${formatCurrency(booking.totalAmount)}
Booked At: ${format(new Date(booking.bookedAt), "PPp")}

Present this ticket when boarding the bus.
=================
`;

      const blob = new Blob([ticketContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${(booking as any)?.bookingId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const response = await api.get(`/bookings/${(booking as any)?.bookingId}/eticket`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bus-eTicket-${(booking as any)?.bookingReference}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download e-ticket:", err);
      alert(
        "Failed to download e-ticket. Please try again or check your email."
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying payment...</p>
        </div>
      </div>
    );
  }

  // Waiting-for-webhook state (poll timed out)
  if (waitingConfirmation && !booking) {
    const handleRefresh = async () => {
      if (!bookingId) return;
      setLoading(true);
      setWaitingConfirmation(false);
      try {
        const r = await api.get(`/bookings/${bookingId}`);
        const b = r?.data?.data || r?.data;
        const st = (b?.status || '').toString().toLowerCase();
        if (st === 'paid' || st === 'completed') {
          setBooking(b);
          setError(null);
          return;
        }
        // still not paid, allow another manual attempt
        setWaitingConfirmation(true);
      } catch (err) {
        console.debug('Manual refresh failed:', err);
        setWaitingConfirmation(true);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <CardTitle>Waiting for Payment Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We are still waiting for the payment provider or our system to confirm your booking. This can take a few seconds.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRefresh}>Refresh Status</Button>
              <Button asChild variant="outline"><Link href="/user/bookings">View My Bookings</Link></Button>
            </div>
            <p className="text-xs text-muted-foreground">If confirmation does not arrive, contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || "Could not verify payment"}
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/user/bookings">View My Bookings</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // return null;
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        {/* Success Header */}
        <Card className="text-center mb-6">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Booking Confirmed!
            </CardTitle>
            <p className="text-muted-foreground">
              Your bus ticket has been successfully booked and paid
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                BOOKING CONFIRMED
              </Badge>
              <div className="text-sm text-muted-foreground">
                Confirmation sent to: {user?.email || "Your registered email"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Confirmation */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-800">
                  Payment Successful
                </h4>
                <p className="text-sm text-green-700">
                  Your payment has been processed and booking is confirmed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Confirmation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Booking ID: {(booking as any)?.bookingId}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trip Details */}
            <div>
              <h4 className="font-medium mb-3">Trip Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.trip?.route?.origin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {booking.trip?.departureTime
                        ? format(
                            new Date(booking.trip.departureTime),
                            "EEEE, MMMM dd, yyyy"
                          )
                        : "Date not available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {booking.trip?.departureTime
                        ? format(new Date(booking.trip.departureTime), "HH:mm")
                        : "Time not available"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.trip?.route?.destination}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bus className="w-4 h-4 text-muted-foreground" />
                    <span>Bus {booking.trip?.bus?.plateNumber || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Model:</span>
                    <span>{booking.trip?.bus?.model || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Passengers */}
            <div>
              <h4 className="font-medium mb-3">Passenger Details</h4>
              <div className="space-y-2">
                {booking.passengers?.map((passenger: any, index: any) => (
                  <div
                    key={passenger.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {passenger.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {passenger.documentId}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Seat {passenger.seatCode}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div>
              <h4 className="font-medium mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Amount</span>
                  <span className="font-medium">
                    {formatCurrency(booking.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Status</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Paid
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Payment Date</span>
                  <span>{format(new Date(), "PPp")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleDownloadTicket}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Ticket
              </Button>
              <Button asChild className="w-full">
                <Link href="/user/bookings">View All Bookings</Link>
              </Button>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Print Confirmation
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/trips">Book Another Trip</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>
                Please arrive at the departure station at least 15 minutes
                before departure time
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>
                Bring your ID document and show this confirmation when boarding
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>
                You can cancel or modify your booking up to 2 hours before
                departure
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium text-blue-600">•</span>
              <span>
                For assistance, contact our customer service at
                support@busticket.com
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessPageContent />
    </Suspense>
  );
}
