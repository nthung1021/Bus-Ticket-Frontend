"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSeatWebSocket } from "@/hooks/useSeatWebSocket";

import {
  ArrowLeft,
  Clock,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  User,
  Bus,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useAuth";
import api from "@/lib/api";
import PaymentService, { type PaymentMethod } from "@/services/paymentService";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { showToast } from "@/lib/toast";
import { formatCurrency } from "@/utils/formatCurrency";
import seatStatusService, { SeatState } from "@/services/seat-status.service";

const serviceFee = 10000;
const processingFee = 5000;

interface BookingData {
  tripId: string;
  seats: SelectedSeat[];
  passengers: PassengerData[];
  totalPrice: number;
  isGuestCheckout?: boolean;
  contactEmail?: string;
  contactPhone?: string;
}

interface SelectedSeat {
  id: string;
  code: string;
  type: "normal" | "vip" | "business";
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

interface TripDetails {
  id: string;
  departureTime: string;
  arrivalTime: string;
  route: {
    origin: string;
    destination: string;
    name: string;
  };
  bus: {
    plateNumber: string;
    model: string;
  };
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading: authLoading } = useCurrentUser();

  const tripId = searchParams.get("tripId");
  const { bookSeat, lockSeat, unlockSeat, bookedSeats } = useSeatWebSocket({
    tripId: tripId || "",
    enabled: !!tripId,
  });
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods] = useState<PaymentMethod[]>(
    PaymentService.getPaymentMethods()
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Timer for booking expiration (15 minutes)
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes in seconds

  // Load booking data and trip details
  useEffect(() => {
    const loadBookingData = async () => {
      // No need to check if user is authenticated, since we allows both User and Guest to book

      try {
        setLoading(true);
        setError(null);

        // Get booking data from sessionStorage
        const savedBookingData = sessionStorage.getItem("bookingData");
        if (!savedBookingData) {
          setError(
            "No booking data found. Please start over from trip selection."
          );
          setLoading(false);
          return;
        }

        let parsedBookingData: BookingData;
        try {
          parsedBookingData = JSON.parse(savedBookingData);
        } catch (parseError) {
          console.error("Failed to parse booking data:", parseError);
          setError(
            "Invalid booking data. Please start over from trip selection."
          );
          setLoading(false);
          return;
        }

        // Validate required fields
        if (
          !parsedBookingData.tripId ||
          !parsedBookingData.seats ||
          !Array.isArray(parsedBookingData.seats) ||
          parsedBookingData.seats.length === 0
        ) {
          setError(
            "Incomplete booking data. Please start over from trip selection."
          );
          setLoading(false);
          return;
        }

        if (
          !parsedBookingData.passengers ||
          !Array.isArray(parsedBookingData.passengers) ||
          parsedBookingData.passengers.length === 0
        ) {
          setError(
            "Passenger information is missing. Please go back and complete passenger details."
          );
          setLoading(false);
          return;
        }

        console.log("Original booking data:", parsedBookingData);
        console.log("Seats data:", parsedBookingData.seats);
        console.log("Passengers data:", parsedBookingData.passengers);
        console.log(
          "Seat codes from seats:",
          parsedBookingData.seats?.map((s) => s.code)
        );
        console.log(
          "Seat codes from passengers:",
          parsedBookingData.passengers?.map((p) => p.seatCode)
        );

        // Validate booking data structure
        if (!parsedBookingData.tripId) {
          console.error("Missing tripId in booking data");
          setError(
            "Invalid booking data: missing trip ID. Please restart from trip selection."
          );
          setLoading(false);
          return;
        }

        // Validate tripId format (should be a UUID)
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(parsedBookingData.tripId)) {
          console.error("Invalid tripId format:", parsedBookingData.tripId);
          setError(
            `Invalid trip ID format: ${parsedBookingData.tripId}. Please restart from trip selection.`
          );
          setLoading(false);
          return;
        }

        console.log("TripId validation passed:", parsedBookingData.tripId);

        // Validate seats exist on the trip's bus
        try {
          console.log("Validating basic trip information...");
          const tripResponse = await api.get(
            `/trips/${parsedBookingData.tripId}`
          );
          if (tripResponse.data.success) {
            const trip = tripResponse.data.data;
            console.log("Trip data:", trip);
            console.log("Bus info:", trip.bus);

            const busId = trip.bus?.id || trip.bus?.busId;
            console.log("Bus ID:", busId);

            if (!busId) {
              console.error("No bus ID found in trip data");
              setError(
                "Trip bus information is missing. Please contact support."
              );
              setLoading(false);
              return;
            }

            // Skip seat layout validation due to API permissions
            // Backend will validate seat existence during booking creation
            console.log(
              "Skipping detailed seat validation - backend will handle seat checks"
            );
            console.log(
              "Selected seats:",
              parsedBookingData.seats.map((s) => s.code)
            );
          } else {
            console.error("Trip not found:", parsedBookingData.tripId);
            setError("Trip not found. Please restart from trip selection.");
            setLoading(false);
            return;
          }
        } catch (tripError) {
          console.error("Error validating trip:", tripError);
          console.warn(
            "Continuing without trip validation - backend will handle validation"
          );
        }

        if (
          !parsedBookingData.seats ||
          !Array.isArray(parsedBookingData.seats) ||
          parsedBookingData.seats.length === 0
        ) {
          console.error("Invalid seats data:", parsedBookingData.seats);
          setError(
            "Invalid booking data: seats information is missing. Please restart from seat selection."
          );
          setLoading(false);
          return;
        }

        if (
          !parsedBookingData.passengers ||
          !Array.isArray(parsedBookingData.passengers) ||
          parsedBookingData.passengers.length === 0
        ) {
          console.error(
            "Invalid passengers data:",
            parsedBookingData.passengers
          );
          setError(
            "Invalid booking data: passenger information is missing. Please complete passenger details."
          );
          setLoading(false);
          return;
        }

        // Validate each seat has required fields
        for (const seat of parsedBookingData.seats) {
          if (
            !seat.id ||
            !seat.code ||
            !seat.type ||
            typeof seat.price !== "number"
          ) {
            console.error("Invalid seat data:", seat);
            setError(
              `Invalid seat data: ${JSON.stringify(seat)}. Please restart from seat selection.`
            );
            setLoading(false);
            return;
          }
        }

        // Validate each passenger has required fields
        for (const passenger of parsedBookingData.passengers) {
          if (
            !passenger.fullName ||
            !passenger.documentId ||
            !passenger.seatCode
          ) {
            console.error("Invalid passenger data:", passenger);
            setError(
              `Invalid passenger data: missing required fields. Please complete passenger details.`
            );
            setLoading(false);
            return;
          }
        }

        // Ensure seat codes match between seats and passengers
        if (parsedBookingData.seats && parsedBookingData.passengers) {
          // First, check if we have the same number of seats and passengers
          if (
            parsedBookingData.seats.length !==
            parsedBookingData.passengers.length
          ) {
            console.error(
              "Seat and passenger count mismatch:",
              `${parsedBookingData.seats.length} seats vs ${parsedBookingData.passengers.length} passengers`
            );
            setError(
              "Booking data inconsistency: number of seats and passengers do not match. Please restart from seat selection."
            );
            setLoading(false);
            return;
          }

          // Get seat codes and passenger seat codes
          const seatCodes = parsedBookingData.seats.map((s) => s.code).sort();
          const passengerSeatCodes = parsedBookingData.passengers
            .map((p) => p.seatCode)
            .sort();

          console.log("Initial seat codes from seats:", seatCodes);
          console.log("Initial passenger seat codes:", passengerSeatCodes);

          // If they don't match, attempt to fix alignment
          if (
            JSON.stringify(seatCodes) !== JSON.stringify(passengerSeatCodes)
          ) {
            console.log(
              "Seat codes do not match, attempting to fix alignment..."
            );

            // Create a mapping of available seats
            const seatMap = new Map(
              parsedBookingData.seats.map((seat) => [seat.code, seat])
            );
            const usedSeatCodes = new Set();

            // Try to match passengers with their assigned seats
            const fixedPassengers = parsedBookingData.passengers.map(
              (passenger, index) => {
                // First, check if passenger's assigned seat exists in selected seats
                if (
                  seatMap.has(passenger.seatCode) &&
                  !usedSeatCodes.has(passenger.seatCode)
                ) {
                  usedSeatCodes.add(passenger.seatCode);
                  return passenger;
                }

                // If not, assign to an available seat
                const availableSeat = parsedBookingData.seats.find(
                  (seat) => !usedSeatCodes.has(seat.code)
                );
                if (availableSeat) {
                  console.log(
                    `Reassigning passenger ${index} from ${passenger.seatCode} to ${availableSeat.code}`
                  );
                  usedSeatCodes.add(availableSeat.code);
                  return { ...passenger, seatCode: availableSeat.code };
                }

                return passenger;
              }
            );

            parsedBookingData.passengers = fixedPassengers;

            // Update sessionStorage with fixed data
            sessionStorage.setItem(
              "bookingData",
              JSON.stringify(parsedBookingData)
            );
            console.log("Fixed booking data saved to sessionStorage");
            console.log(
              "Final passenger seat codes:",
              parsedBookingData.passengers.map((p) => p.seatCode)
            );

            // Verify the fix worked
            const finalSeatCodes = parsedBookingData.seats
              .map((s) => s.code)
              .sort();
            const finalPassengerSeatCodes = parsedBookingData.passengers
              .map((p) => p.seatCode)
              .sort();

            if (
              JSON.stringify(finalSeatCodes) !==
              JSON.stringify(finalPassengerSeatCodes)
            ) {
              console.error("Failed to fix seat code alignment");
              setError(
                "Unable to align seat assignments. Please restart from seat selection."
              );
              setLoading(false);
              return;
            }
          }
        }

        // Ensure totalPrice is calculated if missing
        if (
          !parsedBookingData.totalPrice ||
          parsedBookingData.totalPrice === 0 ||
          isNaN(parsedBookingData.totalPrice)
        ) {
          parsedBookingData.totalPrice = parsedBookingData.seats.reduce(
            (total, seat) => {
              const seatPrice = Number(seat.price) || 0;
              return total + seatPrice;
            },
            0
          );
          console.log(
            "Calculated totalPrice from seats:",
            parsedBookingData.totalPrice
          );

          // Update sessionStorage with calculated price
          sessionStorage.setItem(
            "bookingData",
            JSON.stringify(parsedBookingData)
          );
        }

        // Final validation of totalPrice
        if (
          !parsedBookingData.totalPrice ||
          parsedBookingData.totalPrice <= 0
        ) {
          setError(
            "Invalid booking total. Please start over from trip selection."
          );
          setLoading(false);
          return;
        }

        console.log("Final booking data with totalPrice:", parsedBookingData);

        setBookingData(parsedBookingData);

        // Get trip details from API
        if (parsedBookingData.tripId) {
          try {
            const response = await api.get(
              `/trips/${parsedBookingData.tripId}`
            );
            if (response.data.success) {
              setTripDetails(response.data.data);
            }
          } catch (tripError) {
            console.error("Error fetching trip details:", tripError);
            // Continue without trip details - we have enough info from booking data
          }
        }

        // Set expiration timer (15 minutes from page load)
        setTimeLeft(15 * 60);
      } catch (error) {
        console.error("Error loading booking data:", error);
        setError("Failed to load booking data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [authLoading, user]);

  // Lock seats when payment page loads and unlock on cleanup
  useEffect(() => {
    if (!bookingData?.seats || !tripId) return;

    // Additional check: if bookingData is incomplete, don't proceed
    if (
      !bookingData.tripId ||
      !bookingData.passengers ||
      bookingData.passengers.length === 0
    ) {
      console.log("Incomplete booking data, skipping seat locking");
      return;
    }

    const lockSeats = async () => {
      try {
        // Only lock seats that are not already booked
        const lockPromises = bookingData.seats.map((seat) => {
          // Check if seat is already booked
          if (bookedSeats.has(seat.id)) {
            console.log(`Seat ${seat.id} is already booked, skipping lock`);
            return Promise.resolve(false);
          }
          return lockSeat(seat.id);
        });
        await Promise.allSettled(lockPromises);
        console.log("Seat locking process completed");
      } catch (error) {
        console.error("Error locking seats:", error);
      }
    };

    lockSeats();

    return () => {
      const unlockSeats = async () => {
        try {
          // Only unlock seats that are currently locked by this user
          const unlockPromises = bookingData.seats.map((seat) => {
            // Don't unlock if seat is booked
            if (bookedSeats.has(seat.id)) {
              console.log(`Seat ${seat.id} is already booked, skipping unlock`);
              return Promise.resolve(false);
            }
            return unlockSeat(seat.id);
          });
          await Promise.allSettled(unlockPromises);
          console.log("Seat unlocking process completed");
        } catch (error) {
          console.error("Error unlocking seats:", error);
        }
      };

      unlockSeats();
    };
  }, [bookingData?.seats, tripId, lockSeat, unlockSeat, bookedSeats]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;

        // Show warnings at specific intervals
        if (newTime === 300) {
          // 5 minutes left
          showToast.warning("Only 5 minutes left to complete your booking!");
        } else if (newTime === 120) {
          // 2 minutes left
          showToast.warning(
            "Only 2 minutes left! Please complete payment now."
          );
        } else if (newTime === 30) {
          // 30 seconds left
          showToast.error("⚠️ Last 30 seconds! Complete payment immediately!");
        }

        if (newTime <= 0) {
          // Booking expired
          showToast.error(
            "Booking session expired. Redirecting to trip selection..."
          );
          setTimeout(() => {
            router.push("/trips");
          }, 2000);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, router]);

  // Format time left
  const formatTimeLeft = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Handle payment processing
  const handlePayment = async (retryCount = 0) => {
    console.log("handlePayment called with:", {
      selectedPaymentMethod,
      bookingData: !!bookingData,
    });

    if (!selectedPaymentMethod || !bookingData) {
      console.error("Missing required data:", {
        selectedPaymentMethod,
        hasBookingData: !!bookingData,
      });
      showToast.error("Please select a payment method");
      return;
    }

    console.log("Starting booking creation process...");
    setProcessing(true);
    setPaymentError(null);

    const bookingToast = showToast.loading("Creating your booking...");

    try {
      // Skip payment processing and go directly to booking creation
      // Create booking request with all user-entered information
      const bookingRequest = {
        tripId: bookingData.tripId,
        passengers: bookingData.passengers.map((p) => ({
          fullName: p.fullName,
          documentId: p.documentId,
          seatCode: p.seatCode,
          documentType: p.documentType || "id",
          phoneNumber: p.phoneNumber || "",
          email: p.email || undefined,
        })),
        // Order seats to match passenger seat codes exactly
        seats: bookingData.passengers.map((passenger) => {
          const seat = bookingData.seats.find(
            (s) => s.code === passenger.seatCode
          );
          if (!seat) {
            throw new Error(
              `Seat ${passenger.seatCode} not found in selected seats`
            );
          }
          return {
            id: seat.id,
            code: seat.code,
            type: seat.type,
            price: seat.price,
            // Remove seatCode field - backend DTO doesn't allow it
          };
        }),
        totalPrice: bookingData.totalPrice + serviceFee + processingFee,
        paymentMethod: selectedPaymentMethod,
        isGuestCheckout: bookingData.isGuestCheckout,
        contactEmail: bookingData.isGuestCheckout
          ? bookingData.contactEmail
          : undefined,
        contactPhone: bookingData.isGuestCheckout
          ? bookingData.contactPhone
          : undefined,
      };

      console.log("Creating booking with request:", bookingRequest);
      console.log(
        "Final seat codes from seats:",
        bookingRequest.seats.map((s) => s.code)
      );
      console.log(
        "Final seat codes from passengers:",
        bookingRequest.passengers.map((p) => p.seatCode)
      );
      console.log("Request JSON:", JSON.stringify(bookingRequest, null, 2));

      try {
        console.log("Sending POST request to /bookings...");
        const response = await api.post("/bookings", bookingRequest);
        console.log("API Response:", response);
        console.log("Response data:", response.data);

        if (response.data.success) {
          showToast.dismiss(bookingToast);
          showToast.success("Booking created successfully!");

          // Update seat statuses to 'booked' for all booked seats
          try {
            const bookingId = response.data.data.id;
            const updatePromises = bookingData.seats.map((seat) =>
              bookSeat(seat.id, bookingId)
            );

            const results = await Promise.all(updatePromises);
            const failedUpdates = results.filter((success) => !success).length;

            if (failedUpdates > 0) {
              console.warn(
                `Failed to update status for ${failedUpdates} seats`
              );
              showToast.warning(
                "Booking created, but there was an issue updating some seat statuses"
              );
            } else {
              console.log(
                "✅ Successfully updated all seat statuses to BOOKED"
              );
            }
          } catch (seatUpdateError) {
            console.error("Failed to update seat statuses:", seatUpdateError);
            showToast.warning(
              "Booking created, but there was an issue updating seat statuses"
            );
          }

          // Clear all booking-related data from storage
          sessionStorage.removeItem("bookingData");
          // Clear passenger data for this trip
          localStorage.removeItem(`passengerData_${bookingData.tripId}`);
          console.log(
            "🧹 Cleared localStorage and sessionStorage after successful booking"
          );

          setPaymentSuccess(true);
          // Redirect to success page with actual booking ID
          setTimeout(() => {
            router.push(`/payment/success?bookingId=${response.data.data.id}`);
          }, 1500);
        } else {
          throw new Error(response.data.message || "Failed to create booking");
        }
      } catch (apiError: any) {
        showToast.dismiss(bookingToast);
        console.error("API booking error:", apiError);
        console.error("Error details:", {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            headers: apiError.config?.headers,
          },
        });

        // Log the exact error message from backend
        const backendError = apiError.response?.data;
        console.error("🚨 BACKEND ERROR DETAILS:");
        console.error("Message:", backendError?.message);
        console.error("Error:", backendError?.error);
        console.error("Status Code:", backendError?.statusCode);
        console.error(
          "Full backend response:",
          JSON.stringify(backendError, null, 2)
        );

        // Categorize errors
        const isNetworkError =
          apiError.code === "ECONNREFUSED" || !apiError.response;
        const isServerError = apiError.response?.status >= 500;
        const isClientError =
          apiError.response?.status >= 400 && apiError.response?.status < 500;

        // For network/server errors, try development fallback
        if (isNetworkError || isServerError) {
          console.warn(
            "Backend unavailable or server error, simulating successful booking for development"
          );
          showToast.warning("Backend unavailable - using demo mode");

          // Clear booking data from sessionStorage
          sessionStorage.removeItem("bookingData");

          setPaymentSuccess(true);
          // Redirect to success page with mock booking ID
          setTimeout(() => {
            router.push(
              `/payment/success?bookingId=mock-booking-${Date.now()}`
            );
          }, 1500);
        }
        // For client errors (400-499), show specific error and detailed logging
        else if (isClientError) {
          const errorData = apiError.response?.data;
          const errorMessage =
            errorData?.message ||
            errorData?.error ||
            "Invalid booking data. Please check your information and try again.";

          console.error("Client error details:", {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            errorData: errorData,
            sentData: bookingRequest,
          });

          // Log specific validation errors if available
          if (errorData?.validationErrors) {
            console.error("Validation errors:", errorData.validationErrors);
          }

          // Handle seat-specific errors
          if (
            errorMessage.includes("Seat") &&
            errorMessage.includes("not found")
          ) {
            // Redirect to failure page for seat-specific errors
            const errorParams = new URLSearchParams({
              error: "SEAT_UNAVAILABLE",
              message: errorMessage,
              details:
                "Selected seats are no longer available. Please select different seats.",
              bookingId: "none",
            });
            router.push(`/payment/failure?${errorParams.toString()}`);
            return;
          } else {
            // Redirect to failure page for client errors
            const errorParams = new URLSearchParams({
              error: "VALIDATION_ERROR",
              message: errorMessage,
              details: `Please check your booking information and try again. (Status: ${apiError.response?.status})`,
              bookingId: "none",
            });
            router.push(`/payment/failure?${errorParams.toString()}`);
            return;
          }
        }
        // For other errors, allow retry
        else {
          if (retryCount < 2) {
            console.log(
              `Retrying booking creation, attempt ${retryCount + 2}/3`
            );
            showToast.info(`Retrying... Attempt ${retryCount + 2}/3`);
            setTimeout(() => handlePayment(retryCount + 1), 1000);
            return;
          } else {
            // Redirect to failure page with detailed error information
            const errorMessage =
              "Failed to create booking after multiple attempts. Please try again later.";
            const errorParams = new URLSearchParams({
              error: "SYSTEM_ERROR",
              message: errorMessage,
              details:
                "Maximum retry attempts reached. Please contact support or start a new booking.",
              bookingId: "none",
            });
            router.push(`/payment/failure?${errorParams.toString()}`);
            return;
          }
        }
      }
    } catch (error: any) {
      showToast.dismiss(bookingToast);
      console.error("Booking creation error:", error);

      // Determine error type and redirect to failure page
      let errorType = "SYSTEM_ERROR";
      let errorDetails =
        "An unexpected error occurred during booking creation.";

      if (error.message?.includes("network") || error.code === "ECONNREFUSED") {
        errorType = "NETWORK_ERROR";
        errorDetails =
          "Unable to connect to our servers. Please check your internet connection.";
      } else if (error.message?.includes("validation")) {
        errorType = "VALIDATION_ERROR";
        errorDetails = "Invalid booking information provided.";
      } else if (error.message?.includes("timeout")) {
        errorType = "TIMEOUT_ERROR";
        errorDetails = "The booking process timed out. Please try again.";
      }

      const errorMessage =
        error.message || "Booking creation failed. Please try again.";
      const errorParams = new URLSearchParams({
        error: errorType,
        message: errorMessage,
        details: errorDetails,
        bookingId: "none",
      });

      router.push(`/payment/failure?${errorParams.toString()}`);
    } finally {
      setProcessing(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || "Booking data not found"}
            </p>
            <div className="space-y-2">
              {error?.includes("log in") ? (
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/trips">Back to Trips</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your payment has been processed successfully. You will be
              redirected to the confirmation page.
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Redirecting...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/passenger-info?tripId=${bookingData.tripId}&seats=${encodeURIComponent(JSON.stringify(bookingData.seats))}`}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Passenger Info
            </Link>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-2xl font-bold">Complete Payment</h1>
        </div>

        {/* Expiration Timer */}
        {timeLeft > 0 && (
          <Alert
            className={`mb-6 ${
              timeLeft <= 120
                ? "border-red-200 bg-red-50"
                : timeLeft <= 300
                  ? "border-orange-200 bg-orange-50"
                  : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <Clock
              className={`h-4 w-4 ${
                timeLeft <= 120
                  ? "text-red-600"
                  : timeLeft <= 300
                    ? "text-orange-600"
                    : "text-yellow-600"
              }`}
            />
            <AlertDescription className="flex items-center justify-between">
              <span
                className={
                  timeLeft <= 120
                    ? "text-red-700"
                    : timeLeft <= 300
                      ? "text-orange-700"
                      : "text-yellow-700"
                }
              >
                {timeLeft <= 30 ? "⚠️ " : ""}Complete payment within{" "}
                {formatTimeLeft(timeLeft)} to secure your booking
              </span>
              <Badge
                variant="outline"
                className={`${
                  timeLeft <= 120
                    ? "text-red-800 border-red-300"
                    : timeLeft <= 300
                      ? "text-orange-800 border-orange-300"
                      : "text-yellow-800 border-yellow-300"
                } ${timeLeft <= 30 ? "animate-pulse" : ""}`}
              >
                {formatTimeLeft(timeLeft)} remaining
              </Badge>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <Card className="order-2 lg:order-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Select Payment Method
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose your preferred payment method to complete your booking
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label
                      htmlFor={method.id}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {method.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Separator />

              {/* Booking Security Info */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 mt-0.5" />
                <div>
                  <p className="font-medium">Secure Booking</p>
                  <p>
                    Your booking information is encrypted and secure. Your seat
                    will be reserved immediately upon confirmation.
                  </p>
                </div>
              </div>

              {/* Error Display */}
              {paymentError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{paymentError}</AlertDescription>
                </Alert>
              )}

              {/* Debug Test Button (Development Only) */}
              {process.env.NODE_ENV === "development" && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await api.get("/auth/me");
                        console.log("API Test Success:", response.data);
                        showToast.success("API connection successful");
                      } catch (error) {
                        console.error("API Test Error:", error);
                        showToast.error("API connection failed");
                      }
                    }}
                  >
                    Test API Connection
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log("=== BOOKING DATA DEBUG ===");
                      console.log("Booking Data:", bookingData);
                      console.log(
                        "Selected Payment Method:",
                        selectedPaymentMethod
                      );
                      console.log("User:", user);
                      console.log(
                        "Session Storage:",
                        sessionStorage.getItem("bookingData")
                      );
                      if (bookingData) {
                        console.log(
                          "Seat codes from seats:",
                          bookingData.seats?.map((s) => s.code)
                        );
                        console.log(
                          "Seat codes from passengers:",
                          bookingData.passengers?.map((p) => p.seatCode)
                        );
                      }
                    }}
                  >
                    Debug Booking Data
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!bookingData?.tripId) {
                        showToast.error("No trip ID found");
                        return;
                      }

                      try {
                        console.log("Fetching trip and seat layout...");
                        const tripResponse = await api.get(
                          `/trips/${bookingData.tripId}`
                        );
                        console.log("Trip response:", tripResponse.data);

                        if (
                          tripResponse.data.success &&
                          tripResponse.data.data.bus
                        ) {
                          const busId =
                            tripResponse.data.data.bus.id ||
                            tripResponse.data.data.bus.busId;
                          console.log("Bus ID:", busId);

                          const seatLayoutResponse = await api.get(
                            `/seat-layouts/bus/${busId}`
                          );
                          console.log(
                            "Seat layout response:",
                            seatLayoutResponse.data
                          );

                          if (seatLayoutResponse.data.success) {
                            const seats =
                              seatLayoutResponse.data.data.seats || [];
                            console.log("Available seats:", seats);
                            console.log(
                              "Available seat codes:",
                              seats.map((s: any) => s.seatCode)
                            );

                            // Check which of our selected seats exist
                            bookingData.seats.forEach((selectedSeat) => {
                              const found = seats.find(
                                (s: any) => s.seatCode === selectedSeat.code
                              );
                              console.log(
                                `Seat ${selectedSeat.code}:`,
                                found ? "FOUND" : "NOT FOUND",
                                found
                              );
                            });
                          }
                        }

                        showToast.success(
                          "Trip and seat data fetched - check console"
                        );
                      } catch (error: any) {
                        console.error("Error fetching trip/seat data:", error);
                        showToast.error(
                          `Error: ${error.response?.data?.message || error.message}`
                        );
                      }
                    }}
                  >
                    Check Trip & Seats
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!bookingData?.tripId) {
                        showToast.error("No trip ID");
                        return;
                      }

                      try {
                        console.log("=== COMPREHENSIVE DATABASE CHECK ===");

                        // 1. Get trip info
                        console.log("1. Fetching trip info...");
                        const tripResponse = await api.get(
                          `/trips/${bookingData.tripId}`
                        );
                        const trip = tripResponse.data.data;
                        console.log("Trip response:", tripResponse.data);
                        console.log("Trip data:", trip);

                        // Extract bus info
                        const busInfo = trip.bus;
                        console.log("Bus info:", busInfo);
                        console.log(
                          "Bus ID from response:",
                          busInfo?.busId || busInfo?.id
                        );

                        // 2. Check if we can query seats directly from a public endpoint
                        if (busInfo?.busId) {
                          console.log(
                            "2. Attempting to check if seats exist for bus:",
                            busInfo.busId
                          );

                          // Try to see if there's any way to get seat info
                          try {
                            // Try buses endpoint to see bus details
                            const busResponse = await api.get(
                              `/buses/${busInfo.busId}`
                            );
                            console.log(
                              "Bus details response:",
                              busResponse.data
                            );
                          } catch (busError: any) {
                            console.log(
                              "Could not get bus details:",
                              busError.response?.status
                            );
                          }

                          // Check our selected seats against what backend expects
                          console.log(
                            "3. Our selected seats:",
                            bookingData.seats
                          );
                          console.log(
                            "Seat codes we want to book:",
                            bookingData.seats.map((s) => s.code)
                          );

                          // Check the exact data we're sending
                          const testBookingData = {
                            tripId: bookingData.tripId,
                            passengers: bookingData.passengers.map((p) => ({
                              fullName: p.fullName,
                              documentId: p.documentId,
                              seatCode: p.seatCode,
                              documentType: p.documentType || "id",
                              phoneNumber: p.phoneNumber || "",
                              email: p.email || "",
                            })),
                            seats: bookingData.seats.map((s) => ({
                              id: s.id,
                              code: s.code,
                              type: s.type,
                              price: s.price,
                            })),
                            totalPrice: bookingData.totalPrice,
                            paymentMethod: "test",
                          };

                          console.log(
                            "4. Exact booking request we would send:",
                            JSON.stringify(testBookingData, null, 2)
                          );
                        }

                        showToast.success(
                          "Database check complete - see console"
                        );
                      } catch (error: any) {
                        console.error("Database check error:", error);
                        showToast.error(`Check failed: ${error.message}`);
                      }
                    }}
                  >
                    Database Check
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        console.log(
                          "=== CHECKING AVAILABLE SEATS IN DATABASE ==="
                        );

                        const busId = "563bfb74-5c5d-445c-b6a8-10870c1036c2";
                        console.log(
                          `Fetching available seats for bus: ${busId}`
                        );

                        const seatsResponse = await api.get(
                          `/database/seats/bus/${busId}`
                        );
                        const seatsData = seatsResponse.data;

                        console.log("Available seats response:", seatsData);

                        if (seatsData.success) {
                          console.log(
                            `Found ${seatsData.seatCount} seats in database:`
                          );
                          console.table(seatsData.seats);

                          console.log(
                            `Active seats (${seatsData.seats.filter((s: any) => s.isActive).length}):`,
                            seatsData.seats
                              .filter((s: any) => s.isActive)
                              .map((s: any) => s.seatCode)
                          );

                          // Check if our selected seats exist
                          const ourSeats = ["1A", "1B"];
                          ourSeats.forEach((seatCode) => {
                            const exists = seatsData.seats.find(
                              (s: any) => s.seatCode === seatCode
                            );
                            console.log(
                              `Seat ${seatCode}: ${exists ? "✅ EXISTS" : "❌ NOT FOUND"}`
                            );
                            if (exists) {
                              console.log(
                                `  - Active: ${exists.isActive ? "Yes" : "No"}`
                              );
                              console.log(`  - Type: ${exists.seatType}`);
                              console.log(`  - Bus ID: ${exists.busId}`);
                              console.log(
                                `  - Status Count: ${exists.statusCount}`
                              );
                            }
                          });

                          showToast.success(
                            `Found ${seatsData.seatCount} seats - see console`
                          );
                        } else {
                          console.error(
                            "Failed to get seats:",
                            seatsData.error
                          );
                          showToast.error(`Failed: ${seatsData.error}`);
                        }
                      } catch (error: any) {
                        console.error("Seats check error:", error);
                        showToast.error(`Check failed: ${error.message}`);
                      }
                    }}
                  >
                    Check Available Seats
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (bookingData?.tripId) {
                        // Clear booking data and go back to trip selection
                        sessionStorage.removeItem("bookingData");
                        router.push(`/trips/${bookingData.tripId}`);
                      } else {
                        router.push("/trips");
                      }
                    }}
                  >
                    Reselect Seats
                  </Button>
                </div>
              )}

              {/* Payment Button */}
              <Button
                onClick={() => {
                  console.log("Payment button clicked");
                  console.log(
                    "Selected payment method:",
                    selectedPaymentMethod
                  );
                  console.log("Has booking data:", !!bookingData);
                  handlePayment();
                }}
                disabled={!selectedPaymentMethod || processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Complete Booking{" "}
                    {formatCurrency(
                      bookingData.totalPrice + serviceFee + processingFee
                    )}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Booking Summary */}
          <Card className="order-1 lg:order-2">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trip Info */}
              <div>
                <h4 className="font-medium mb-2">Trip Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {tripDetails?.route?.origin || "Origin"} →{" "}
                      {tripDetails?.route?.destination || "Destination"}
                    </span>
                  </div>
                  {tripDetails?.departureTime && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(tripDetails.departureTime), "PPP")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {format(new Date(tripDetails.departureTime), "p")}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {tripDetails?.bus?.plateNumber ||
                        "Bus details loading..."}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Passengers */}
              <div>
                <h4 className="font-medium mb-2">Passengers</h4>
                <div className="space-y-2">
                  {bookingData.passengers.map((passenger, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {passenger.fullName} - Seat {passenger.seatCode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Subtotal ({bookingData.passengers.length} passenger
                    {bookingData.passengers.length !== 1 ? "s" : ""})
                  </span>
                  <span>{formatCurrency(bookingData.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Service fee:</span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Processing fee:</span>
                  <span>{formatCurrency(processingFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(
                      bookingData.totalPrice + serviceFee + processingFee
                    )}
                  </span>
                </div>
              </div>

              {/* Seats Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Trip ID: {bookingData.tripId}</p>
                <p>
                  Selected Seats:{" "}
                  {bookingData.seats.map((s) => s.code).join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading payment page...</p>
            </div>
          </div>
        }
      >
        <PaymentPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
