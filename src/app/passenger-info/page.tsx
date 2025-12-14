"use client";

import { useState, useEffect, useCallback, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import { useSeatWebSocket } from "@/hooks/useSeatWebSocket";
import { useBookingWebSocket } from "@/hooks/useBookingWebSocket";
import { BookingStatus } from "@/services/booking-websocket.service";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Bus,
  CreditCard,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";
import PassengerFormItem from "@/components/passenger/PassengerFormItem";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/formatCurrency";

// const serviceFee = 10000;
// const processingFee = 5000;

interface SelectedSeat {
  id: string;
  code: string;
  type: "normal" | "vip" | "business";
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
  busModel: string;
  price: number;
}

interface PassengerData {
  fullName: string;
  documentId: string;
  seatCode: string;
  documentType?: "id" | "passport" | "license";
  phoneNumber?: string;
  email?: string;
}

function PassengerInfoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const isGuest = !currentUser;

  // Get URL parameters
  const tripId = searchParams.get("tripId");
  const selectedSeatsParam = searchParams.get("seats");

  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [passengersData, setPassengersData] = useState<PassengerData[]>([]);
  const [passengerValidations, setPassengerValidations] = useState<boolean[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactErrors, setContactErrors] = useState<{
    email?: string;
    phone?: string;
  }>({});

  // WebSocket to maintain seat locks during passenger info process
  const { lockSeat, unlockSeat, unlockAllMySeats, bookedSeats } =
    useSeatWebSocket({
      tripId: tripId || "",
      enabled: !!tripId,
    });

  // WebSocket for booking management - only enable when tripId is valid
  const {
    isConnected: isBookingConnected,
    bookings,
    trackBooking,
    updateBookingStatus,
    getBookingStatus,
  } = useBookingWebSocket({
    tripId: tripId || "",
    enabled: !!tripId && tripId.length > 0,
    userId: currentUser?.id,
  });

  // Lock all selected seats when component mounts
  useEffect(() => {
    if (selectedSeats.length > 0 && tripId) {
      const lockSeats = async () => {
        console.log(
          "Locking seats for passenger info:",
          selectedSeats.map((s) => s.id)
        );

        // Only lock seats that are not already booked
        const lockPromises = selectedSeats.map((seat) => {
          if (bookedSeats.has(seat.id)) {
            console.log(`Seat ${seat.id} is already booked, skipping lock`);
            return Promise.resolve(false);
          }
          return lockSeat(seat.id);
        });

        const results = await Promise.allSettled(lockPromises);

        const failedLocks = results.filter(
          (result) => result.status === "rejected" || !result.value
        );

        if (failedLocks.length > 0) {
          console.warn(`Failed to lock ${failedLocks.length} seats`);
          toast.error(
            "Some seats are no longer available. Please select different seats."
          );
          // Redirect back to seat selection if seats are no longer available
          setTimeout(() => {
            router.push(`/trips/${tripId}`);
          }, 2000);
        } else {
          console.log("All seats locked successfully");
        }
      };

      lockSeats();

      // Cleanup function to unlock seats when component unmounts
      return () => {
        const unlockSeats = async () => {
          console.log(
            "Unlocking seats on passenger info cleanup:",
            selectedSeats.map((s) => s.id)
          );

          // Only unlock seats that are not already booked
          const unlockPromises = selectedSeats.map((seat) => {
            if (bookedSeats.has(seat.id)) {
              console.log(`Seat ${seat.id} is already booked, skipping unlock`);
              return Promise.resolve(false);
            }
            return unlockSeat(seat.id);
          });

          await Promise.allSettled(unlockPromises);
          console.log("Seat unlocking process completed");
        };

        unlockSeats();
      };
    }
  }, [selectedSeats, tripId, lockSeat, unlockSeat, router, bookedSeats]);

  // Unlock all seats when component unmounts or user leaves
  useEffect(() => {
    return () => {
      if (selectedSeats.length > 0) {
        console.log("Unlocking seats on component unmount");
        unlockAllMySeats();
      }
    };
  }, [selectedSeats, unlockAllMySeats]);

  useEffect(() => {
    // Try to load existing data from localStorage first
    const savedPassengerData = localStorage.getItem(`passengerData_${tripId}`);

    // Parse selected seats from URL params
    if (selectedSeatsParam) {
      try {
        const seats = JSON.parse(
          decodeURIComponent(selectedSeatsParam)
        ) as SelectedSeat[];
        setSelectedSeats(seats);

        // Load saved data or initialize new data
        if (savedPassengerData) {
          const savedData = JSON.parse(savedPassengerData);

          // Check if saved data matches current seat selection
          const savedSeatCodes = savedData.passengers
            ?.map((p: any) => p.seatCode)
            .sort();
          const currentSeatCodes = seats.map((s) => s.code).sort();
          const seatsMatch =
            JSON.stringify(savedSeatCodes) === JSON.stringify(currentSeatCodes);

          console.log("🔍 Checking localStorage compatibility:");
          console.log("- Saved seat codes:", savedSeatCodes);
          console.log("- Current seat codes:", currentSeatCodes);
          console.log("- Seats match:", seatsMatch);

          if (seatsMatch && savedData.passengers?.length === seats.length) {
            // Migrate old data format to include missing fields
            const migratedPassengers = savedData.passengers.map(
              (passenger: any) => ({
                ...passenger,
                documentType: passenger.documentType || "id",
                phoneNumber: passenger.phoneNumber || "",
                email: passenger.email || "",
              })
            );
            setPassengersData(migratedPassengers);
            setPassengerValidations(
              savedData.validations || new Array(seats.length).fill(false)
            );
            console.log("✅ Using saved passenger data");
          } else {
            // Seats don't match - clear old data and start fresh
            console.log("🔄 Seat mismatch - clearing old data");
            localStorage.removeItem(`passengerData_${tripId}`);
            initializeNewPassengerData(seats);
          }
        } else {
          // No saved data - initialize new
          console.log("🆕 No saved data - initializing fresh");
          initializeNewPassengerData(seats);
        }
      } catch (error) {
        console.error("Error parsing seats:", error);
        // Clear corrupted data and redirect back
        localStorage.removeItem(`passengerData_${tripId}`);
        router.push(`/trips/${tripId}`);
        return;
      }
    } else {
      // No seats selected, redirect back
      router.push(`/trips/${tripId}`);
      return;
    }

    // Fetch trip information from API
    const loadTripInfo = async () => {
      if (!tripId) {
        setLoading(false);
        return;
      }

      const tripData = await fetchTripInfo(tripId);
      if (tripData) {
        setTripInfo(tripData);
        console.log("Trip info loaded:", tripData);
      } else {
        console.error("Failed to load trip information");
        // Optionally redirect back if trip not found
        router.push(`/trips/${tripId}`);
      }
      setLoading(false);
    };

    loadTripInfo();
  }, [selectedSeatsParam, tripId, router]);

  // Helper function to initialize new passenger data
  const initializeNewPassengerData = (seats: SelectedSeat[]) => {
    const initialData = seats.map((seat) => ({
      fullName: "",
      documentId: "",
      seatCode: seat.code,
      documentType: "id" as const,
      phoneNumber: "",
      email: "",
    }));
    setPassengersData(initialData);
    setPassengerValidations(new Array(seats.length).fill(false));
  };

  // Function to fetch trip information from API
  const fetchTripInfo = async (tripId: string): Promise<TripInfo | null> => {
    try {
      const response = await api.get(`/trips/${tripId}`);
      const apiResponse = response.data;

      // Debug log to see actual structure
      console.log("Raw API response:", apiResponse);

      // Check if API call was successful
      if (!apiResponse.success || !apiResponse.data) {
        console.error("API returned unsuccessful response:", apiResponse);
        return null;
      }

      const trip = apiResponse.data;

      // Transform API response to match TripInfo interface
      return {
        id: trip.tripId,
        name: `${trip.route.origin} - ${trip.route.destination}`,
        departure: trip.route.origin,
        arrival: trip.route.destination,
        departureTime: new Date(trip.schedule.departureTime).toLocaleString(
          "en-CA",
          {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        ),
        arrivalTime: new Date(trip.schedule.arrivalTime).toLocaleString(
          "en-CA",
          {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        ),
        duration: `${Math.floor(trip.schedule.duration / 60)}h ${trip.schedule.duration % 60}m`,
        price: trip.pricing.basePrice,
        busModel: trip.bus.model,
      };
    } catch (error) {
      console.error("Error fetching trip information:", error);
      return null;
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("🔍 PASSENGER INFO DEBUG:");
    console.log("- selectedSeats length:", selectedSeats.length);
    console.log("- selectedSeats data:", selectedSeats);
    console.log("- passengersData length:", passengersData.length);
    console.log("- passengersData:", passengersData);
    console.log("- passengerValidations:", passengerValidations);
    console.log("- tripId:", tripId);
    console.log("- selectedSeatsParam:", selectedSeatsParam);
  }, [
    selectedSeats,
    passengersData,
    passengerValidations,
    tripId,
    selectedSeatsParam,
  ]);

  // Ensure passenger data is synced with selected seats
  useEffect(() => {
    if (
      selectedSeats.length > 0 &&
      passengersData.length !== selectedSeats.length
    ) {
      console.log("Syncing passenger data with selected seats");
      // If we have seats but no passenger data, initialize it
      if (passengersData.length === 0) {
        const initialData = selectedSeats.map((seat) => ({
          fullName: "",
          documentId: "",
          seatCode: seat.code,
          documentType: "id" as const,
          phoneNumber: "",
          email: "",
        }));
        setPassengersData(initialData);
        setPassengerValidations(new Array(selectedSeats.length).fill(false));
      }
    }
  }, [selectedSeats, passengersData.length]);

  const updatePassengerData = useCallback(
    (index: number, data: Partial<PassengerData>) => {
      setPassengersData((prev) => {
        const updatedData = prev.map((passenger, i) =>
          i === index ? { ...passenger, ...data } : passenger
        );

        // Save to localStorage
        const dataToSave = {
          passengers: updatedData,
          validations: passengerValidations,
        };
        localStorage.setItem(
          `passengerData_${tripId}`,
          JSON.stringify(dataToSave)
        );

        return updatedData;
      });
    },
    [tripId, passengerValidations]
  );

  const updatePassengerValidation = useCallback(
    (index: number, isValid: boolean) => {
      setPassengerValidations((prev) => {
        const newValidations = [...prev];
        newValidations[index] = isValid;

        // Save to localStorage
        const dataToSave = {
          passengers: passengersData,
          validations: newValidations,
        };
        localStorage.setItem(
          `passengerData_${tripId}`,
          JSON.stringify(dataToSave)
        );

        return newValidations;
      });
    },
    [tripId, passengersData]
  );

  const calculateTotalPrice = () => {
    const tripPrice = tripInfo ? tripInfo.price : 0;
    const seatsPrice = selectedSeats.reduce((total, seat) => {
      const price = seat.price ?? 0;
      return total + price;
    }, 0);
    return tripPrice + seatsPrice;
  };

  const validateContactInfo = () => {
    const errors: { email?: string; phone?: string } = {};

    if (isGuest) {
      if (!contactEmail.trim()) {
        errors.email = "Contact email is required for guest checkout";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(contactEmail)) {
          errors.email = "Please enter a valid email address";
        }
      }

      if (!contactPhone.trim()) {
        errors.phone = "Contact phone is required for guest checkout";
      } else {
        const phoneRegex = /^(\+84|84|0)([3-9]\d{8})$/;
        const cleanPhone = contactPhone.replace(/[\s-()]/g, "");
        if (!phoneRegex.test(cleanPhone)) {
          errors.phone = "Invalid Vietnamese phone number (e.g., 0912345678)";
        }
      }
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);

    try {
      // Check if booking WebSocket is connected
      if (!isBookingConnected) {
        throw new Error("Booking service is not connected. Please try again.");
      }

      // Create booking data
      const bookingData = {
        tripId,
        seats: selectedSeats,
        passengers: passengersData,
        totalPrice: calculateTotalPrice(),
        isGuestCheckout: isGuest,
        contactEmail: isGuest ? contactEmail : undefined,
        contactPhone: isGuest ? contactPhone : undefined,
      };

      // Create booking first to get the booking ID
      const bookingResponse = await api.post("/bookings", bookingData);

      if (!bookingResponse.data?.success || !bookingResponse.data?.data) {
        throw new Error(
          bookingResponse.data?.message || "Failed to create booking"
        );
      }

      const createdBooking = bookingResponse.data.data;
      const bookingId = createdBooking.id;

      // Track the booking using WebSocket for real-time updates
      const trackResult = await trackBooking(bookingId);
      if (!trackResult) {
        console.warn("Failed to track booking for real-time updates");
      }

      // Update booking status to PENDING using WebSocket
      const updateResult = await updateBookingStatus(
        bookingId,
        BookingStatus.PENDING,
        {
          paymentInitiated: true,
          paymentMethod: "payos",
          totalPrice: calculateTotalPrice(),
        }
      );

      if (!updateResult) {
        console.warn("Failed to update booking status to PENDING");
      }

      // Store booking data for payment confirmation
      sessionStorage.setItem(
        "bookingData",
        JSON.stringify({
          ...bookingData,
          bookingId,
          bookingReference: createdBooking.bookingReference,
        })
      );

      // Create PayOS payment link with actual booking ID
      const response = await api.post("/payos/create-payment-link", {
        amount: calculateTotalPrice(),
        bookingId: bookingId,
        description: "",
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/failure`,
      });

      if (response.data.checkoutUrl) {
        // Redirect to PayOS payment page
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error("Failed to create payment link");
      }
    } catch (error: any) {
      console.error("Error processing booking:", error);

      // Handle different error types
      let errorMessage = "Error processing your booking. Please try again.";
      let errorType = "SYSTEM_ERROR";

      if (error.response?.status === 400) {
        errorType = "VALIDATION_ERROR";
        errorMessage =
          error.response.data?.message ||
          "Invalid booking information provided.";
      } else if (error.response?.status === 409) {
        errorType = "SEAT_UNAVAILABLE";
        errorMessage =
          "Selected seats are no longer available. Please select different seats.";
      } else if (error.response?.status >= 500) {
        errorType = "SYSTEM_ERROR";
        errorMessage = "Server error occurred. Please try again later.";
      }

      // Redirect to failure page with error details
      const errorParams = new URLSearchParams({
        error: errorType,
        message: errorMessage,
        details:
          error.response.data?.details || "Failed to create payment link",
        bookingId: "none",
      });

      router.push(`/payment/failure?${errorParams.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeatTypeLabel = (type: string) => {
    switch (type) {
      case "business":
        return {
          label: "Business",
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "vip":
        return {
          label: "VIP",
          color: "bg-purple-100 text-purple-800 border-purple-200",
        };
      default:
        return {
          label: "Normal",
          color: "bg-green-100 text-green-800 border-green-200",
        };
    }
  };

  const handleBackToSeatSelection = () => {
    // Save current passenger data before going back
    const dataToSave = {
      passengers: passengersData,
      validations: passengerValidations,
    };
    localStorage.setItem(`passengerData_${tripId}`, JSON.stringify(dataToSave));

    // Navigate back to trip page (seat selection)
    router.push(`/trips/${tripId}`);
  };

  const isFormValid = useCallback(() => {
    // Check if all passengers have valid forms
    return (
      passengerValidations.every((isValid) => isValid) &&
      passengerValidations.length === selectedSeats.length
    );
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
        alert(
          `Please complete and fix errors for passenger(s): ${invalidPassengers.join(", ")}`
        );
      } else {
        alert("Please fill in all required passenger information");
      }
      return;
    }

    if (isGuest && !validateContactInfo()) {
      alert("Please complete valid contact information for guest checkout.");
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
          <p className="text-muted-foreground">
            Loading passenger information...
          </p>
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
                    <p className="font-medium">
                      {tripInfo.departure} → {tripInfo.arrival}
                    </p>
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
                    <div className="text-sm text-muted-foreground mb-1">
                      Duration
                    </div>
                    <p className="font-medium">{tripInfo.duration}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Bus Model
                    </div>
                    <p className="font-medium">{tripInfo.busModel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form (for Guest only) */}
            {isGuest && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please provide your contact information so we can send your
                    booking confirmation and updates.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="contact-email"
                        className="text-sm font-medium"
                      >
                        Contact Email{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className={
                          contactErrors.email
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : ""
                        }
                        aria-invalid={Boolean(contactErrors.email)}
                        aria-describedby={
                          contactErrors.email
                            ? "contact-email-error"
                            : undefined
                        }
                      />
                      {contactErrors.email && (
                        <p
                          id="contact-email-error"
                          className="text-destructive text-xs font-medium flex items-center gap-1"
                          role="alert"
                        >
                          <span className="text-destructive">⚠</span>
                          {contactErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="contact-phone"
                        className="text-sm font-medium"
                      >
                        Contact Phone{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="0912345678 or +84912345678"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className={
                          contactErrors.phone
                            ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                            : ""
                        }
                        aria-invalid={Boolean(contactErrors.phone)}
                        aria-describedby={
                          contactErrors.phone
                            ? "contact-phone-error"
                            : undefined
                        }
                      />
                      {contactErrors.phone && (
                        <p
                          id="contact-phone-error"
                          className="text-destructive text-xs font-medium flex items-center gap-1"
                          role="alert"
                        >
                          <span className="text-destructive">⚠</span>
                          {contactErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your contact details will only be used for booking-related
                    notifications.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Passenger Forms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Passenger Details ({selectedSeats.length} passenger
                  {selectedSeats.length > 1 ? "s" : ""})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedSeats.length > 0 && passengersData.length > 0 ? (
                  selectedSeats.map((seat, index) => {
                    try {
                      // Create stable callback functions for each passenger
                      const handleUpdateData = (data: Partial<PassengerData>) =>
                        updatePassengerData(index, data);
                      const handleValidationChange = (isValid: boolean) =>
                        updatePassengerValidation(index, isValid);

                      // Ensure we have passenger data for this index
                      const passengerData = passengersData[index] || {
                        fullName: "",
                        documentId: "",
                        seatCode: seat.code,
                        documentType: "id" as const,
                        phoneNumber: "",
                        email: "",
                      };

                      console.log(`🎫 Rendering passenger ${index + 1}:`, {
                        seat,
                        passengerData,
                        hasUpdateCallback:
                          typeof handleUpdateData === "function",
                        hasValidationCallback:
                          typeof handleValidationChange === "function",
                      });

                      return (
                        <PassengerFormItem
                          key={seat.id}
                          passengerNumber={index + 1}
                          seat={seat}
                          passengerData={passengerData}
                          onUpdate={handleUpdateData}
                          onValidationChange={handleValidationChange}
                        />
                      );
                    } catch (error) {
                      console.error(
                        `❌ Error rendering passenger form ${index + 1}:`,
                        error
                      );
                      return (
                        <div
                          key={seat.id}
                          className="p-4 border border-red-200 rounded-lg bg-red-50"
                        >
                          <p className="text-red-600">
                            Error loading passenger form {index + 1}
                          </p>
                          <p className="text-sm text-red-500">
                            Seat: {seat.code}
                          </p>
                          <p className="text-xs text-red-400">
                            {error instanceof Error
                              ? error.message
                              : "Unknown error"}
                          </p>
                        </div>
                      );
                    }
                  })
                ) : selectedSeats.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-red-600">No seats selected</p>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/trips/${tripId}`)}
                      className="mt-2"
                    >
                      Go Back to Trip
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Loading passenger forms...
                    </p>
                  </div>
                )}
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
                {/* Base price */}
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Base Price</h4>
                  <span className="space-y-2 font-medium text-sm">
                    {formatCurrency(tripInfo.price)}
                  </span>
                </div>
                {/* Selected Seats */}
                <div>
                  <h4 className="font-medium mb-3">Selected Seats</h4>
                  <div className="space-y-2">
                    {selectedSeats.map((seat) => {
                      const price = seat.price ?? 0;
                      return (
                        <div
                          key={seat.id}
                          className="flex justify-between items-center text-sm"
                        >
                          <span>
                            Seat {seat.code}
                            <span className="text-muted-foreground ml-1">
                              (
                              {seat.type === "normal"
                                ? "Normal"
                                : seat.type === "vip"
                                  ? "VIP"
                                  : "Business"}
                              )
                            </span>
                          </span>
                          <span className="font-medium">
                            {formatCurrency(price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Additional Fee */}
                {/* <div className="flex justify-between items-center">
                  <h4 className="font-medium">Service Fee</h4>
                  <span className="space-y-2 font-medium text-sm">
                    {formatCurrency(serviceFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Processing Fee</h4>
                  <span className="space-y-2 font-medium text-sm">
                    {formatCurrency(processingFee)}
                  </span>
                </div> */}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount</span>
                    <span className="text-primary">
                      {formatCurrency(
                        // calculateTotalPrice() + serviceFee + processingFee
                        calculateTotalPrice()
                      )}
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
                        {passengerValidations.filter((v) => !v).length}{" "}
                        passenger(s) need attention
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
                  <span className="font-medium ml-1">
                    {tripInfo?.departure} → {tripInfo?.arrival}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium ml-1">
                    {tripInfo?.departureTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Seats */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-medium text-xs">
                  Seats ({selectedSeats.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((seat) => {
                  const seatType = getSeatTypeLabel(seat.type);
                  return (
                    <div
                      key={seat.id}
                      className="flex items-center gap-1.5 px-2 py-1 border rounded bg-muted/20"
                    >
                      <div className="w-5 h-5 bg-primary/10 rounded text-xs font-medium flex items-center justify-center text-primary">
                        {seat.code}
                      </div>
                      <div className="text-xs">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1 py-0 ${seatType.color}`}
                        >
                          {seatType.label}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium">
                        {(seat.price ?? 0).toLocaleString("vi-VN")}₫
                      </span>
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
                  <div
                    key={index}
                    className="flex items-center justify-between px-2 py-1.5 bg-muted/20 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{passenger.fullName}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        Seat {passenger.seatCode}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {passenger.documentId}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-2" />

            {/* Price Summary */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Seat charges:</span>
                <span>{formatCurrency(calculateTotalPrice())}</span>
              </div>
              {/* <div className="flex justify-between text-xs">
                <span>Service fee:</span>
                <span>{formatCurrency(serviceFee)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Processing fee:</span>
                <span>{formatCurrency(processingFee)}</span>
              </div> */}
              <Separator className="my-1.5" />
              <div className="flex justify-between font-semibold text-sm">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {formatCurrency(
                    // calculateTotalPrice() + serviceFee + processingFee
                    calculateTotalPrice()
                  )}
                </span>
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

export default function PassengerInfoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      }
    >
      <PassengerInfoPageContent />
    </Suspense>
  );
}
