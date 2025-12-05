"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Clock, Bus, Users, CreditCard, CheckCircle } from "lucide-react";

interface SelectedSeat {
  id: string;
  code: string;
  type: 'normal' | 'vip' | 'business';
  price: number;
}

interface PassengerData {
  fullName: string;
  documentId: string;
  seatCode: string;
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

interface BookingData {
  tripId: string;
  seats: SelectedSeat[];
  passengers: PassengerData[];
  totalPrice: number;
}

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tripId = searchParams.get("tripId");
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    // Load booking data from sessionStorage
    const savedBookingData = sessionStorage.getItem("bookingData");
    
    if (savedBookingData) {
      try {
        const data = JSON.parse(savedBookingData) as BookingData;
        setBookingData(data);
      } catch (error) {
        console.error("Error parsing booking data:", error);
        router.push("/");
        return;
      }
    } else {
      // No booking data, redirect to home
      router.push("/");
      return;
    }

    // Load trip information (mock data for now)
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
  }, [tripId, router]);

  const handleBackToPassengerInfo = () => {
    if (bookingData) {
      const seatsParam = encodeURIComponent(JSON.stringify(bookingData.seats));
      router.push(`/passenger-info?tripId=${tripId}&seats=${seatsParam}`);
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingData) return;

    setIsConfirming(true);
    
    try {
      // Here you would typically:
      // 1. Create final booking in backend
      // 2. Process payment
      // 3. Send confirmation email
      
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to payment page
      router.push(`/payment?tripId=${tripId}`);
      
    } catch (error) {
      console.error("Error confirming booking:", error);
      alert("Error confirming booking. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const getSeatTypeLabel = (type: string) => {
    switch (type) {
      case 'business':
        return { label: 'Business', color: 'bg-blue-100 text-blue-800' };
      case 'vip':
        return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Normal', color: 'bg-green-100 text-green-800' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking review...</p>
        </div>
      </div>
    );
  }

  if (!bookingData || !tripInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto p-6 text-center">
          <h2 className="text-h3 mb-4">No Booking Data Found</h2>
          <p className="text-muted-foreground mb-6">
            Unable to load booking information. Please try again.
          </p>
          <Button asChild>
            <span onClick={() => router.push("/")}>Return Home</span>
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
            onClick={handleBackToPassengerInfo}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Passenger Info
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-h2 font-semibold">Booking Review</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="w-5 h-5" />
                  Trip Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      Route
                    </div>
                    <p className="font-medium text-lg">{tripInfo.departure} → {tripInfo.arrival}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      Departure
                    </div>
                    <p className="font-medium text-lg">{tripInfo.departureTime}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Selected Seats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Selected Seats ({bookingData.seats.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bookingData.seats.map((seat) => {
                    const seatType = getSeatTypeLabel(seat.type);
                    return (
                      <div key={seat.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center font-semibold text-primary">
                            {seat.code}
                          </div>
                          <div>
                            <p className="font-medium">Seat {seat.code}</p>
                            <Badge variant="outline" className={seatType.color}>
                              {seatType.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{seat.price.toLocaleString('vi-VN')} VNĐ</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Passenger Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Passenger Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookingData.passengers.map((passenger, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-primary">Passenger {index + 1}</span>
                            <Badge variant="outline">Seat {passenger.seatCode}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Full Name</div>
                              <p className="font-medium">{passenger.fullName}</p>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">ID Number</div>
                              <p className="font-medium">{passenger.documentId}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seat Breakdown */}
                <div>
                  <h4 className="font-medium mb-3">Seat Charges</h4>
                  <div className="space-y-2">
                    {bookingData.seats.map((seat) => (
                      <div key={seat.id} className="flex justify-between items-center text-sm">
                        <span>Seat {seat.code}</span>
                        <span>{seat.price.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Service Fees */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>Service Fee</span>
                    <span>10,000 VNĐ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Processing Fee</span>
                    <span>5,000 VNĐ</span>
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">
                    {(bookingData.totalPrice + 15000).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                <Button 
                  onClick={handleConfirmBooking}
                  disabled={isConfirming}
                  className="w-full"
                  size="lg"
                >
                  {isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Confirming...
                    </>
                  ) : (
                    "Confirm & Pay"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By confirming, you agree to our terms and conditions and privacy policy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}