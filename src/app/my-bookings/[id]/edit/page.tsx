"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, Bus } from "lucide-react";
import UserBookingService, { modifyPassengerDetails, changeSeats } from "@/services/userBookingService";
import { BookingEditForm } from "@/components/booking/BookingEditForm";
import { SeatSelectionForEdit } from "@/components/booking/SeatSelectionForEdit";
import { ConfirmChangesModal } from "@/components/booking/ConfirmChangesModal";
import { SaveProgress } from "@/components/booking/SaveProgress";
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
    documentId?: string | null;
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
  const [savingStep, setSavingStep] = useState<'passenger' | 'seats' | 'complete' | null>(null);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const userBookingService = new UserBookingService();
      const bookings = await userBookingService.getUserBookings();
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

  const refreshBookingDetails = async () => {
    try {
      const userBookingService = new UserBookingService();
      const bookings = await userBookingService.getUserBookings();
      const foundBooking = bookings.find(b => b.id === bookingId);
      if (foundBooking) {
        setBooking(foundBooking);
        // Reset changes state after successful update
        setChanges({
          passengerChanges: [],
          seatChanges: [],
          priceDifference: 0
        });
      }
    } catch (err) {
      console.error("Error refreshing booking:", err);
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
    if (!booking) return;
    
    const originalBookingState = { ...booking };
    let passengerUpdateSuccess = false;
    let seatUpdateSuccess = false;
    
    try {
      setSaving(true);
      setShowConfirmModal(false); // Close modal to show progress
      
      // Step 1: Apply passenger changes if any
      if (changes.passengerChanges.length > 0) {
        setSavingStep('passenger');
        toast.loading("Updating passenger information...", {
          duration: 3000,
          id: 'passenger-update'
        });
        
        try {
          const passengerResult = await modifyPassengerDetails(bookingId, changes.passengerChanges);
          passengerUpdateSuccess = true;
          
          toast.success(
            `Updated information for ${changes.passengerChanges.length} passenger${changes.passengerChanges.length > 1 ? 's' : ''}`,
            { id: 'passenger-update' }
          );
          
          console.log('Passenger update result:', passengerResult);
        } catch (passengerErr: any) {
          toast.error(
            `Failed to update passenger information: ${passengerErr.response?.data?.message || passengerErr.message}`,
            { id: 'passenger-update' }
          );
          throw new Error(`Passenger update failed: ${passengerErr.response?.data?.message || passengerErr.message}`);
        }
      } else {
        passengerUpdateSuccess = true; // No passenger changes, consider as success
      }
      
      // Step 2: Apply seat changes if any
      if (changes.seatChanges.length > 0) {
        setSavingStep('seats');
        toast.loading("Changing seat assignments...", {
          duration: 3000,
          id: 'seat-update'
        });
        
          try {
          const seatPayload = changes.seatChanges.map(c => ({ passengerId: c.passengerId, newSeatCode: c.newSeatCode }));
          const seatResult = await changeSeats(bookingId, seatPayload);
          seatUpdateSuccess = true;
          
          // Show detailed seat change feedback
          const seatChangeMessage = changes.seatChanges
            .map(change => {
              const passenger = booking.passengers.find(p => p.id === change.passengerId);
              return `${passenger?.fullName || 'Passenger'}: ${change.oldSeatCode} → ${change.newSeatCode}`;
            })
            .join(', ');
          
          toast.success(
            `Seat changes applied: ${seatChangeMessage}`,
            { 
              id: 'seat-update',
              duration: 5000 // Longer duration for seat change details
            }
          );
          
          // Show price change if applicable
          if (seatResult.data.totalPriceDifference !== 0) {
            const priceMessage = seatResult.data.totalPriceDifference > 0 
              ? `Additional cost: ${formatCurrency(seatResult.data.totalPriceDifference)}`
              : `Refund: ${formatCurrency(Math.abs(seatResult.data.totalPriceDifference))}`;
            
            toast(priceMessage, {
              duration: 4000,
              icon: 'ℹ️',
            });
          }
          
          console.log('Seat update result:', seatResult);
        } catch (seatErr: any) {
          console.error('Seat change error:', seatErr);
          
          // Handle rollback for seat changes
          if (passengerUpdateSuccess && changes.passengerChanges.length > 0) {
            toast.error(
              "Seat change failed. Passenger information was updated but seats remain unchanged.",
              { 
                id: 'seat-update',
                duration: 6000
              }
            );
            
            // Partial success scenario
            toast(
              "Your passenger information has been saved. You can try changing seats again later.",
              { duration: 5000, icon: 'ℹ️' }
            );
          } else {
            toast.error(
              `Failed to change seats: ${seatErr.response?.data?.message || seatErr.message}`,
              { 
                id: 'seat-update',
                duration: 5000
              }
            );
          }
          
          throw new Error(`Seat change failed: ${seatErr.response?.data?.message || seatErr.message}`);
        }
      } else {
        seatUpdateSuccess = true; // No seat changes, consider as success
      }
      
      // Step 3: Complete success
      setSavingStep('complete');
      
      // Refresh booking details to get updated information
      await refreshBookingDetails();
      
      // Final success message
      const changesSummary = [];
      if (changes.passengerChanges.length > 0) {
        changesSummary.push(`${changes.passengerChanges.length} passenger info update${changes.passengerChanges.length > 1 ? 's' : ''}`);
      }
      if (changes.seatChanges.length > 0) {
        changesSummary.push(`${changes.seatChanges.length} seat change${changes.seatChanges.length > 1 ? 's' : ''}`);
      }
      
      toast.success(
        `✅ Booking updated successfully! Applied: ${changesSummary.join(' and ')}`,
        {
          duration: 4000,
          icon: '🎉'
        }
      );
      
      // Navigate back with a delay to show the success message
      setTimeout(() => {
        router.push("/user/bookings");
      }, 1500);
      
    } catch (err: any) {
      console.error("Error saving changes:", err);
      
      // Determine error type and show appropriate message
      const errorMessage = err.message || err.response?.data?.message || "An unexpected error occurred";
      
      // Show main error toast
      toast.error(
        `❌ Failed to update booking: ${errorMessage}`,
        {
          duration: 6000,
          icon: '⚠️'
        }
      );
      
      // Re-open confirmation modal for retry
      setTimeout(() => {
        setShowConfirmModal(true);
      }, 1000);
      
    } finally {
      setSaving(false);
      setSavingStep(null);
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
      <div className="border-b">
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
              disabled={saving}
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
                      disabled={!hasChanges() || saving}
                    >
                      {saving 
                        ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {savingStep === 'passenger' && 'Updating Passengers...'}
                            {savingStep === 'seats' && 'Changing Seats...'}
                            {savingStep === 'complete' && 'Finalizing...'}
                            {!savingStep && 'Saving Changes...'}
                          </>
                        )
                        : 'Save Changes'
                      }
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
        booking={booking ? {
          ...booking,
          passengers: booking.passengers.map(p => ({ ...p, documentId: p.documentId ?? undefined }))
        } : booking}
      />

      {/* Save Progress Indicator */}
      <SaveProgress 
        show={saving}
        currentStep={savingStep}
        hasPassengerChanges={changes.passengerChanges.length > 0}
        hasSeatChanges={changes.seatChanges.length > 0}
      />
    </div>
  );
}