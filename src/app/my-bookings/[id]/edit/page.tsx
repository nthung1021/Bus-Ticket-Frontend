"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, Bus } from "lucide-react";
import { getUserBookings, modifyPassengerDetails, changeSeats } from "@/services/userBookingService";
import { BookingEditForm } from "@/components/booking/BookingEditForm";
import { SeatSelectionForEdit } from "@/components/booking/SeatSelectionForEdit";
import { ConfirmChangesModal } from "@/components/booking/ConfirmChangesModal";
import { formatCurrency } from "@/utils/formatCurrency";
import toast from "react-hot-toast";

interface Booking {
  id: string;
  reference: string;
  status: string;
  totalAmount: number;
  bookedAt: string;
  trip: {
    id: string;
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
    route: {
      origin: string;
      destination: string;
      name: string;
    };
    bus: {
      id: string;
      plateNumber: string;
      model: string;
      seatCapacity: number;
    };
  };
  passengers: Array<{
    id: string;
    fullName: string;
    documentId: string;
    seatCode: string;
  }>;
}

interface ChangeData {
  passengerChanges: Array<{
    id: string;
    fullName?: string;
    documentId?: string;
  }>;
  seatChanges: Array<{
    passengerId: string;
    oldSeatCode: string;
    newSeatCode: string;
  }>;
  priceDifference: number;
}

export default function BookingEditPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<ChangeData>({
    passengerChanges: [],
    seatChanges: [],
    priceDifference: 0
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const bookings = await getUserBookings();
      const foundBooking = bookings.find(b => b.id === bookingId);
      
      if (!foundBooking) {
        setError("Booking not found");
        return;
      }

      setBooking(foundBooking);
    } catch (err) {
      console.error("Error loading booking:", err);
      setError("Failed to load booking details");
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handlePassengerChange = (passengerId: string, field: string, value: string) => {
    setChanges(prev => {
      const existingChange = prev.passengerChanges.find(c => c.id === passengerId);
      
      if (existingChange) {
        return {
          ...prev,
          passengerChanges: prev.passengerChanges.map(c => 
            c.id === passengerId 
              ? { ...c, [field]: value }
              : c
          )
        };
      } else {
        return {
          ...prev,
          passengerChanges: [...prev.passengerChanges, {
            id: passengerId,
            [field]: value
          }]
        };
      }
    });
  };

  const handleSeatChange = (passengerId: string, oldSeatCode: string, newSeatCode: string) => {
    setChanges(prev => {
      const existingChange = prev.seatChanges.find(c => c.passengerId === passengerId);
      
      if (existingChange) {
        return {
          ...prev,
          seatChanges: prev.seatChanges.map(c => 
            c.passengerId === passengerId 
              ? { ...c, newSeatCode }
              : c
          )
        };
      } else {
        return {
          ...prev,
          seatChanges: [...prev.seatChanges, {
            passengerId,
            oldSeatCode,
            newSeatCode
          }]
        };
      }
    });
  };

  const hasChanges = () => {
    return changes.passengerChanges.length > 0 || changes.seatChanges.length > 0;
  };

  const handleSaveChanges = () => {
    if (!hasChanges()) {
      toast.error("No changes to save");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmChanges = async () => {
    try {
      setSaving(true);
      
      // Apply passenger changes if any
      if (changes.passengerChanges.length > 0) {
        await modifyPassengerDetails(bookingId, changes.passengerChanges);
      }
      
      // Apply seat changes if any  
      if (changes.seatChanges.length > 0) {
        await changeSeats(bookingId, changes.seatChanges);
      }
      
      toast.success("Booking updated successfully!");
      router.push("/user/bookings");
    } catch (err: any) {
      console.error("Error saving changes:", err);
      toast.error(err.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center pt-6">
            <p className="text-destructive mb-4">{error || "Booking not found"}</p>
            <Button onClick={() => router.push("/user/bookings")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push("/user/bookings")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Bookings
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Booking</h1>
                <p className="text-muted-foreground">Booking Reference: {booking.reference}</p>
              </div>
            </div>
            <Badge variant={booking.status === "paid" ? "default" : "secondary"}>
              {booking.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trip Info & Passenger Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Trip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{booking.trip.route.origin}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{booking.trip.route.destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(booking.trip.departureTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-muted-foreground" />
                  <span>{booking.trip.bus.plateNumber} - {booking.trip.bus.model}</span>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Edit Form */}
            <BookingEditForm 
              passengers={booking.passengers}
              onPassengerChange={handlePassengerChange}
            />
          </div>

          {/* Right Column - Seat Selection */}
          <div className="space-y-6">
            <SeatSelectionForEdit 
              tripId={booking.trip.id}
              busId={booking.trip.bus.id}
              currentSeats={booking.passengers.map(p => p.seatCode)}
              passengers={booking.passengers}
              onSeatChange={handleSeatChange}
            />

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Current Total: {formatCurrency(booking.totalAmount)}</p>
                    {changes.priceDifference !== 0 && (
                      <p className={changes.priceDifference > 0 ? "text-red-600" : "text-green-600"}>
                        Price Change: {changes.priceDifference > 0 ? "+" : ""}{formatCurrency(changes.priceDifference)}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={handleSaveChanges}
                      className="w-full"
                      disabled={!hasChanges()}
                    >
                      Save Changes
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push("/user/bookings")}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmChangesModal 
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmChanges}
        changes={changes}
        loading={saving}
        booking={booking}
      />
    </div>
  );
}