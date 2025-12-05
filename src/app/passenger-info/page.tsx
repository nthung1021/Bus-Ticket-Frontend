"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Users, MapPin, Clock, Bus, CreditCard, X, Check } from "lucide-react";
import Link from "next/link";
import PassengerFormItem from "@/components/passenger/PassengerFormItem";

interface SelectedSeat {
  id: string;
  code: string;
  type: 'normal' | 'vip' | 'business';
  price: number;
}

interface TripInfo {
  id: string;
  name: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  busType: string;
}

interface PassengerData {
  fullName: string;
  documentId: string;
  seatCode: string;
}

export default function PassengerInfoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get URL parameters
  const tripId = searchParams.get("tripId");
  const selectedSeatsParam = searchParams.get("seats");
  
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [passengersData, setPassengersData] = useState<PassengerData[]>([]);
  const [passengerValidations, setPassengerValidations] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    // Try to load existing data from localStorage first
    const savedPassengerData = localStorage.getItem(`passengerData_${tripId}`);
    
    // Parse selected seats from URL params
    if (selectedSeatsParam) {
      try {
        const seats = JSON.parse(decodeURIComponent(selectedSeatsParam)) as SelectedSeat[];
        setSelectedSeats(seats);
        
        // Load saved data or initialize new data
        if (savedPassengerData) {
          const savedData = JSON.parse(savedPassengerData);
          setPassengersData(savedData.passengers);
          setPassengerValidations(savedData.validations);
        } else {
          // Initialize passenger data array
          setPassengersData(seats.map(seat => ({
            fullName: "",
            documentId: "",
            seatCode: seat.code
          })));
          // Initialize validation array
          setPassengerValidations(new Array(seats.length).fill(false));
        }
      } catch (error) {
        console.error("Error parsing seats:", error);
        // Redirect back if seats data is invalid
        router.push(`/trips/${tripId}`);
        return;
      }
    } else {
      // No seats selected, redirect back
      router.push(`/trips/${tripId}`);
      return;
    }

    // Fetch trip information (mock data for now)
    // In real implementation, fetch from API
    setTripInfo({
      id: tripId || "",
      name: "Hanoi - Ho Chi Minh City",
      departure: "Hanoi",
      arrival: "Ho Chi Minh City", 
      departureTime: "08:00 AM",
      arrivalTime: "06:00 PM",
      duration: "10h 0m",
      busType: "VIP Sleeper"
    });
    
    setLoading(false);
  }, [selectedSeatsParam, tripId, router]);

  const updatePassengerData = useCallback((index: number, data: Partial<PassengerData>) => {
    setPassengersData(prev => {
      const updatedData = prev.map((passenger, i) => 
        i === index ? { ...passenger, ...data } : passenger
      );
      
      // Save to localStorage
      const dataToSave = {
        passengers: updatedData,
        validations: passengerValidations
      };
      localStorage.setItem(`passengerData_${tripId}`, JSON.stringify(dataToSave));
      
      return updatedData;
    });
  }, [tripId, passengerValidations]);

  const updatePassengerValidation = useCallback((index: number, isValid: boolean) => {
    setPassengerValidations(prev => {
      const newValidations = [...prev];
      newValidations[index] = isValid;
      
      // Save to localStorage
      const dataToSave = {
        passengers: passengersData,
        validations: newValidations
      };
      localStorage.setItem(`passengerData_${tripId}`, JSON.stringify(dataToSave));
      
      return newValidations;
    });
  }, [tripId, passengersData]);

  const calculateTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    
    try {
      // Create booking data
      const bookingData = {
        tripId,
        seats: selectedSeats,
        passengers: passengersData,
        totalPrice: calculateTotalPrice()
      };
      
      // Store in sessionStorage for payment
      sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
      
      // Navigate to payment page
      router.push(`/payment?tripId=${tripId}`);
      
    } catch (error) {
      console.error("Error processing booking:", error);
      alert("Error processing your booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeatTypeLabel = (type: string) => {
    switch (type) {
      case 'business':
        return { label: 'Business', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'vip':
        return { label: 'VIP', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: 'Normal', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const handleBackToSeatSelection = () => {
    // Save current passenger data before going back
    const dataToSave = {
      passengers: passengersData,
      validations: passengerValidations
    };
    localStorage.setItem(`passengerData_${tripId}`, JSON.stringify(dataToSave));
    
    // Navigate back to trip page (seat selection)
    router.push(`/trips/${tripId}`);
  };

  const isFormValid = useCallback(() => {
    // Check if all passengers have valid forms
    return passengerValidations.every(isValid => isValid) && passengerValidations.length === selectedSeats.length;
  }, [passengerValidations, selectedSeats.length]);

  const handleContinue = async () => {
    if (!isFormValid()) {
      // Find which passengers have invalid forms
      const invalidPassengers: number[] = [];
      passengerValidations.forEach((isValid, index) => {
        if (!isValid) {
          invalidPassengers.push(index + 1);
        }
      });
      
      if (invalidPassengers.length > 0) {
        alert(`Please complete and fix errors for passenger(s): ${invalidPassengers.join(', ')}`);
      } else {
        alert("Please fill in all required passenger information");
      }
      return;
    }

    // Show review modal instead of navigating
    setShowReviewModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading passenger information...</p>
        </div>
      </div>
    );
  }

  if (!tripInfo || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto p-6 text-center">
          <h2 className="text-h3 mb-4">No Trip Information Found</h2>
          <p className="text-muted-foreground mb-6">
            Unable to load trip or seat information. Please try again.
          </p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToSeatSelection}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Seat Selection
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-h2 font-semibold">Passenger Information</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      Route
                    </div>
                    <p className="font-medium">{tripInfo.departure} → {tripInfo.arrival}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      Departure
                    </div>
                    <p className="font-medium">{tripInfo.departureTime}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Duration</div>
                    <p className="font-medium">{tripInfo.duration}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Bus Type</div>
                    <p className="font-medium">{tripInfo.busType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Forms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Passenger Details ({selectedSeats.length} passenger{selectedSeats.length > 1 ? 's' : ''})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedSeats.map((seat, index) => {
                  // Create stable callback functions for each passenger
                  const handleUpdateData = (data: Partial<PassengerData>) => updatePassengerData(index, data);
                  const handleValidationChange = (isValid: boolean) => updatePassengerValidation(index, isValid);
                  
                  return (
                    <PassengerFormItem
                      key={seat.id}
                      passengerNumber={index + 1}
                      seat={seat}
                      passengerData={passengersData[index]}
                      onUpdate={handleUpdateData}
                      onValidationChange={handleValidationChange}
                    />
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Seats */}
                <div>
                  <h4 className="font-medium mb-3">Selected Seats</h4>
                  <div className="space-y-2">
                    {selectedSeats.map((seat) => (
                      <div key={seat.id} className="flex justify-between items-center text-sm">
                        <span>
                          Seat {seat.code} 
                          <span className="text-muted-foreground ml-1">
                            ({seat.type === 'normal' ? 'Normal' : seat.type === 'vip' ? 'VIP' : 'Business'})
                          </span>
                        </span>
                        <span className="font-medium">
                          {seat.price.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount</span>
                    <span className="text-primary">
                      {calculateTotalPrice().toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={handleContinue}
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    "Review Booking"
                  )}
                </Button>

                {/* Validation Status */}
                {selectedSeats.length > 0 && (
                  <div className="text-xs text-center">
                    {isFormValid() ? (
                      <span className="text-green-600 flex items-center justify-center gap-1">
                        <span className="text-green-500">✓</span>
                        All passenger information is valid
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center justify-center gap-1">
                        <span className="text-amber-500">⚠</span>
                        {passengerValidations.filter(v => !v).length} passenger(s) need attention
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  By continuing, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="w-4 h-4" />
              Booking Review
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Trip Summary */}
            <div className="bg-muted/30 p-2.5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bus className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium text-xs">Trip</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Route:</span>
                  <span className="font-medium ml-1">{tripInfo?.departure} → {tripInfo?.arrival}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium ml-1">{tripInfo?.departureTime}</span>
                </div>
              </div>
            </div>

            {/* Selected Seats */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium text-xs">Seats ({selectedSeats.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((seat) => {
                  const seatType = getSeatTypeLabel(seat.type);
                  return (
                    <div key={seat.id} className="flex items-center gap-1.5 px-2 py-1 border rounded bg-muted/20">
                      <div className="w-5 h-5 bg-primary/10 rounded text-xs font-medium flex items-center justify-center text-primary">
                        {seat.code}
                      </div>
                      <div className="text-xs">
                        <Badge variant="outline" className={`text-xs px-1 py-0 ${seatType.color}`}>
                          {seatType.label}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium">{seat.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passengers Summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium text-xs">Passengers</span>
              </div>
              <div className="space-y-1">
                {passengersData.map((passenger, index) => (
                  <div key={index} className="flex items-center justify-between px-2 py-1.5 bg-muted/20 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{passenger.fullName}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">Seat {passenger.seatCode}</Badge>
                    </div>
                    <span className="text-muted-foreground">{passenger.documentId}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-2" />

            {/* Price Summary */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Seat charges:</span>
                <span>{calculateTotalPrice().toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Service fee:</span>
                <span>10,000 VNĐ</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Processing fee:</span>
                <span>5,000 VNĐ</span>
              </div>
              <Separator className="my-1.5" />
              <div className="flex justify-between font-semibold text-sm">
                <span>Total Amount:</span>
                <span className="text-primary">{(calculateTotalPrice() + 15000).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 h-9 text-xs"
              >
                Edit Information
              </Button>
              <Button 
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="flex-1 h-9 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    Processing...
                  </>
                ) : (
                  "Confirm & Pay"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}