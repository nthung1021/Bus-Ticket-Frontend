"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useAuth";
import api from "@/lib/api";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  Ticket,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Bus,
  Loader2,
  AlertCircle,
} from "lucide-react";

type GuestBooking = {
  id: string;
  bookingReference?: string;
  totalAmount: number;
  status: string;
  bookedAt: string;
  contactEmail?: string;
  contactPhone?: string;
  trip?: {
    id: string;
    routeId?: string;
    busId?: string;
    departureTime?: string;
    arrivalTime?: string;
    basePrice?: string;
    status?: string;
    route?: {
      id?: string;
      name?: string;
      description?: string;
      origin?: string;
      destination?: string;
      distanceKm?: number;
      estimatedMinutes?: number;
    };
    bus?: {
      id?: string;
      plateNumber?: string;
      model?: string;
      seatCapacity?: number;
    };
  };
  passengerDetails?: {
    id: string;
    fullName: string;
    documentId: string;
    seatCode: string;
  }[];
};

export default function TicketsPage() {
  const { data: user, isLoading } = useCurrentUser();

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [booking, setBooking] = useState<GuestBooking | null>(null);
  const [routeDetails, setRouteDetails] = useState<any>(null);
  const [busDetails, setBusDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setBooking(null);
    setRouteDetails(null);
    setBusDetails(null);
    setHasSearched(false);

    const trimmedEmail = contactEmail.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedEmail || !trimmedPhone) {
      setError("Please enter both contact email and contact phone.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.get("/bookings/guest", {
        params: {
          contactEmail: trimmedEmail,
          contactPhone: trimmedPhone,
        },
      });

      if (!response.data?.success || !response.data?.data) {
        setError(response.data?.message || "Could not find booking for the provided contact info.");
        setHasSearched(true);
        return;
      }

      const data = response.data.data as GuestBooking;
      
      // Fetch additional route and bus details if we have the IDs
      if (data.trip?.routeId) { 
        try {
          const routeResponse = await api.get(`/routes/${data.trip.routeId}`);
          setRouteDetails(routeResponse.data);
        } catch (err) {
          console.warn("Failed to fetch route details:", err);
        }
      }
      
      if (data.trip?.busId) {
        try {
          const busResponse = await api.get(`/buses/${data.trip.busId}`);
          setBusDetails(busResponse.data);
        } catch (err) {
          console.warn("Failed to fetch bus details:", err);
        }
      }

      setBooking(data);
      setHasSearched(true);
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message;

      setError(backendMessage || "Failed to lookup booking. Please try again.");
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking your session...</p>
        </div>
      </div>
    );
  }

  // Logged-in users: redirect to My Bookings
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>You have already logged in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please go to the <span className="font-medium">My Bookings</span> page for detailed information
              about your tickets.
            </p>
            <Button asChild className="w-full">
              <Link href="/user/bookings">Go to My Bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasResult = !!booking;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Find Your Ticket</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enter the contact email and phone number you used when booking as a guest.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLookup}>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="e.g. 0912345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the same email and phone number you entered on the passenger information page.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />
                  <p className="text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Find My Booking
              </Button>
            </form>
          </CardContent>
        </Card>

        {hasSearched && !hasResult && !loading && !error && (
          <Card>
            <CardContent className="py-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No booking found for the provided contact information. Please make sure your email and phone
                number are correct.
              </p>
            </CardContent>
          </Card>
        )}

        {hasResult && booking && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Booking ID</p>
                  <p className="font-medium break-all">{booking.id}</p>
                </div>
                {booking.bookingReference && (
                  <div className="space-y-1 text-right">
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-medium">{booking.bookingReference}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Trip Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>From: {routeDetails?.origin || booking.trip?.route?.origin || "Origin not available"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {booking.trip?.departureTime
                          ? format(new Date(booking.trip.departureTime), "EEEE, MMMM dd, yyyy")
                          : "Date not available"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {booking.trip?.departureTime
                          ? format(new Date(booking.trip.departureTime), "HH:mm")
                          : "Time not available"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>To: {routeDetails?.destination || booking.trip?.route?.destination || "Destiation not available"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-muted-foreground" />
                      <span>Bus Plate: {busDetails?.plateNumber || booking.trip?.bus?.plateNumber || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-muted-foreground" /> 
                      <span>Bus Model: {busDetails?.model || booking.trip?.bus?.model || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Passenger Details</h4>
                <div className="space-y-2">
                  {booking.passengerDetails?.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{p.fullName}</p>
                          <p className="text-xs text-muted-foreground">ID: {p.documentId}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Seat {p.seatCode}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Booked At</p>
                  <p className="font-medium">
                    {booking.bookedAt ? format(new Date(booking.bookedAt), "PPp") : "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(booking.totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

