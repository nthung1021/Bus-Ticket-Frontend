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
import UserBookingService, {
  type Booking,
} from "@/services/userBookingService";
import api from "@/lib/api";
import { formatCurrency } from "@/utils/formatCurrency";

function PaymentSuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();

  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailTriggered, setEmailTriggered] = useState(false);

  const bookingService = new UserBookingService();

  // Fetch updated booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        setError(null);

        // Check if it's a mock booking ID
        if (bookingId.startsWith("mock-booking-")) {
          console.log("Mock booking detected, creating mock booking data");
          // Create mock booking for success page
          const mockBooking = {
            id: bookingId,
            userId: user?.id ?? "guest",
            tripId: "mock-trip-123",
            reference: "MOCK-BK-20241201-12345",
            totalAmount: 250000,
            status: "paid" as const,
            bookedAt: new Date().toISOString(),
            trip: {
              id: "mock-trip-123",
              departureTime: new Date(
                Date.now() + 24 * 60 * 60 * 1000
              ).toLocaleString("en-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              arrivalTime: new Date(
                Date.now() + 28 * 60 * 60 * 1000
              ).toLocaleString("en-CA", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              basePrice: 250000,
              status: "active",
              route: {
                id: "mock-route-123",
                name: "Mock Route",
                description: "Test route for development",
                origin: "Hanoi",
                destination: "Ho Chi Minh City",
                distanceKm: 1700,
                estimatedMinutes: 1200,
              },
              bus: {
                id: "mock-bus-123",
                plateNumber: "TEST-123",
                model: "Test Bus Model",
                seatCapacity: 40,
              },
            },
            passengers: [
              {
                id: "mock-passenger-1",
                fullName: "Nguyen Van Test",
                documentId: "123456789",
                seatCode: "A1",
              },
            ],
            seats: [
              {
                id: "mock-seat-status-1",
                seatId: "mock-seat-1",
                state: "booked",
                seat: {
                  id: "mock-seat-1",
                  seatCode: "A1",
                  seatType: "normal",
                  isActive: true,
                },
              },
            ],
          };
          setBooking(mockBooking);
        } else {
          const bookingData = await bookingService.getBookingById(bookingId);
          setBooking(bookingData);

          // Verify payment status
          if (bookingData.status !== "paid") {
            setError(
              "Payment verification failed. Please contact support if you believe this is an error."
            );
          }
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load booking details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, user?.id]);

  // Automatically trigger e-ticket email sending for real bookings
  useEffect(() => {
    const sendEticketEmail = async () => {
      if (!booking || !booking.id) return;

      // Skip mock bookings
      if (booking.id.startsWith("mock-booking-")) return;

      // Avoid sending multiple times if state changes
      if (emailTriggered) return;

      try {
        await api.post(`/bookings/${booking.id}/eticket/email`, {});
        setEmailTriggered(true);
        console.log("E-ticket email triggered for booking", booking.id);
      } catch (err) {
        console.error("Failed to send e-ticket email:", err);
      }
    };

    sendEticketEmail();
  }, [booking, emailTriggered]);

  // Auto-redirect if no booking ID
  useEffect(() => {
    if (!bookingId) {
      router.push("/user/bookings");
    }
  }, [bookingId, router]);

  // Download e-ticket
  const handleDownloadTicket = async () => {
    if (!booking) return;

    // For mock bookings, keep existing simple text-based ticket behavior
    if (booking.id.startsWith("mock-booking-")) {
      const ticketContent = `
=== BUS TICKET ===
Booking ID: ${booking.id}
Status: PAID
Route: ${booking.trip?.route?.origin} → ${booking.trip?.route?.destination}
Date: ${booking.trip?.departureTime ? format(new Date(booking.trip.departureTime), "PPP") : "N/A"}
Time: ${booking.trip?.departureTime ? format(new Date(booking.trip.departureTime), "p") : "N/A"}
Bus: ${booking.trip?.bus?.plateNumber || "N/A"}
Passengers: ${booking.passengers?.map((p) => `${p.fullName} (Seat ${p.seatCode})`).join(", ")}
Total Amount: ${formatCurrency(booking.totalAmount)}
Booked At: ${format(new Date(booking.bookedAt), "PPp")}

Present this ticket when boarding the bus.
=================
`;

      const blob = new Blob([ticketContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${booking.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    try {
      const response = await api.get(`/bookings/${booking.id}/eticket`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bus-eTicket-${booking.reference}.pdf`;
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
              Booking ID: {booking.id}
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
                {booking.passengers?.map((passenger, index) => (
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
