"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Clock,
  CreditCard,
  Shield,
  Phone,
  Mail,
  Home,
  Search,
  Loader2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useAuth";
import { showToast } from "@/lib/toast";
import { usePaymentRetry } from "@/hooks/usePaymentRetry";

interface PaymentError {
  code?: string;
  message: string;
  type: "network" | "payment" | "validation" | "system" | "timeout";
  retryable: boolean;
  details?: string;
}

const ERROR_TYPES: Record<string, PaymentError> = {
  PAYMENT_FAILED: {
    code: "PAYMENT_FAILED",
    message: "Payment transaction was declined",
    type: "payment",
    retryable: true,
    details:
      "Your payment could not be processed. Please check your payment details or try a different payment method.",
  },
  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    message: "Network connection failed",
    type: "network",
    retryable: true,
    details:
      "Unable to connect to our payment servers. Please check your internet connection and try again.",
  },
  VALIDATION_ERROR: {
    code: "VALIDATION_ERROR",
    message: "Invalid payment information",
    type: "validation",
    retryable: true,
    details:
      "Some payment details are incorrect. Please review your information and try again.",
  },
  TIMEOUT_ERROR: {
    code: "TIMEOUT_ERROR",
    message: "Payment session expired",
    type: "timeout",
    retryable: false,
    details: "Your payment session has timed out. Please start a new booking.",
  },
  SYSTEM_ERROR: {
    code: "SYSTEM_ERROR",
    message: "System temporarily unavailable",
    type: "system",
    retryable: true,
    details:
      "Our payment system is temporarily unavailable. Please try again in a few minutes.",
  },
  SEAT_UNAVAILABLE: {
    code: "SEAT_UNAVAILABLE",
    message: "Selected seats no longer available",
    type: "system",
    retryable: false,
    details:
      "One or more of your selected seats have been booked by another customer. Please select different seats.",
  },
  BOOKING_EXPIRED: {
    code: "BOOKING_EXPIRED",
    message: "Booking session expired",
    type: "timeout",
    retryable: false,
    details:
      "Your booking session has expired (15-minute limit). Please start a new booking.",
  },
};

function PaymentFailurePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();

  const [bookingData, setBookingData] = useState<any>(null);

  // Load retry state from sessionStorage on mount
  const getInitialRetryState = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("paymentRetryState");
        console.log(saved);
        if (saved) {
          const parsed = JSON.parse(saved);

          // Check if retry state is recent (within 5 minutes) to avoid stale data
          const now = Date.now();
          const stateAge = now - parsed.timestamp;
          const fiveMinutes = 5 * 60 * 1000;

          if (stateAge < fiveMinutes) {
            return parsed;
          } else {
            sessionStorage.removeItem("paymentRetryState");
          }
        } else {
          console.log("No retry state found in sessionStorage");
        }
      } catch (err) {
        console.warn("Failed to parse saved retry state:", err);
      }
    }
    return null;
  };

  const initialRetryState = getInitialRetryState();
  // console.log(initialRetryState);

  // Use payment retry hook with initial state from sessionStorage
  const { execute, state, reset } = usePaymentRetry({
    maxRetries: 3,
    retryDelay: 1000,
    initialAttempt: initialRetryState?.attempt || 0,
    onRetry: (attempt) => {
      console.log(`Payment retry attempt ${attempt}`);
    },
    onSuccess: () => {
      console.log("Payment retry succeeded");
      // Don't clear retry state on success - let it persist for potential retries
      // State will be cleared when user actually completes payment successfully
    },
    onFailure: (error) => {
      console.error("Payment retry failed:", error);
      // Keep retry state for next attempt
    },
  });

  // Save retry state to sessionStorage (sync operation)
  const saveRetryState = (attempt: number) => {
    console.log("saveRetryState called with attempt:", attempt);
    const retryState = {
      attempt,
      orderCode: searchParams.get("orderCode"),
      timestamp: Date.now(),
    };
    console.log("Saving retry state:", retryState);
    sessionStorage.setItem("paymentRetryState", JSON.stringify(retryState));
    console.log(
      "Verify saved data:",
      sessionStorage.getItem("paymentRetryState")
    );
  };

  const errorCode = searchParams.get("error") || "PAYMENT_FAILED";
  const bookingId = searchParams.get("bookingId");
  const paymentId = searchParams.get("paymentId");
  const orderCode = searchParams.get("orderCode");

  // Parse error information from URL parameters
  useEffect(() => {
    const errorType = ERROR_TYPES[errorCode] || ERROR_TYPES.PAYMENT_FAILED;
    setError(errorType);

    // Override with custom message if provided
    const customMessage = searchParams.get("message");
    if (customMessage) {
      errorType.message = customMessage;
    }

    const customDetails = searchParams.get("details");
    if (customDetails) {
      errorType.details = customDetails;
    }

    // Try to recover booking data from sessionStorage if available
    try {
      const savedBookingData = sessionStorage.getItem("bookingData");
      if (savedBookingData) {
        setBookingData(JSON.parse(savedBookingData));
      }
    } catch (err) {
      console.error("Failed to parse saved booking data:", err);
    }
  }, [errorCode, searchParams]);

  const [error, setError] = useState<PaymentError | null>(null);

  // Handle retry payment
  const handleRetryPayment = async () => {
    console.log("handleRetryPayment called");
    if (!error?.retryable) {
      showToast.error(
        "This error cannot be retried. Please start a new booking."
      );
      return;
    }

    if (!state.canRetry) {
      showToast.error(
        "Maximum retry attempts reached. Please contact support."
      );
      return;
    }

    if (!bookingData) {
      showToast.info("Starting new booking...");
      setTimeout(() => {
        router.push("/trips");
      }, 1000);
      return;
    }

    console.log("About to call execute function");
    // Use payment retry hook to execute the retry logic
    const result = await execute(async () => {
      console.log("Execute function called");
      const api = (await import("@/lib/api")).default;

      // Cancel old payment link if exists
      if (orderCode) {
        await api.post(`/payos/cancel-payment/${orderCode}`);
      }

      // Create new payment link
      const response = await api.post("/payos/create-payment-link", {
        amount: bookingData.totalPrice || 0,
        bookingId: bookingData.bookingId,
        description: "",
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/failure`,
      });

      if (!response.data.checkoutUrl) {
        throw new Error("Failed to create payment link");
      }

      console.log("About to save retry state and redirect");
      // Save retry state BEFORE redirecting
      saveRetryState(state.attempt + 1);

      // Redirect to PayOS checkout
      window.location.href = response.data.checkoutUrl;
      return response.data;
    }, "payment retry");

    console.log("Execute function completed, result:", result);
    if (!result) {
      // Retry failed, hook already handled error display
      console.error("Payment retry failed after all attempts");
    }
  };

  // Handle start new booking
  const handleStartNewBooking = () => {
    // Clear any existing booking data
    sessionStorage.removeItem("bookingData");
    localStorage.clear();
    router.push("/trips");
  };

  // Handle contact support
  const handleContactSupport = () => {
    const supportEmail = "support@busticket.com";
    const subject = encodeURIComponent(
      "Payment Issue - Booking ID: " + (bookingId || "Unknown")
    );
    const body = encodeURIComponent(
      `I encountered a payment issue while trying to book a bus ticket.\n\n` +
        `Error Code: ${error?.code || "Unknown"}\n` +
        `Error Message: ${error?.message || "Unknown"}\n` +
        `Booking ID: ${bookingId || "Unknown"}\n` +
        `Payment ID: ${paymentId || "Unknown"}\n` +
        `User ID: ${user?.id || "Guest"}\n` +
        `Time: ${new Date().toISOString()}\n\n` +
        `Please help me resolve this issue.`
    );

    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  // Get error icon and color based on type
  const getErrorIcon = () => {
    switch (error?.type) {
      case "network":
        return <AlertCircle className="h-12 w-12 text-orange-500" />;
      case "payment":
        return <CreditCard className="h-12 w-12 text-red-500" />;
      case "validation":
        return <XCircle className="h-12 w-12 text-yellow-500" />;
      case "timeout":
        return <Clock className="h-12 w-12 text-purple-500" />;
      case "system":
        return <AlertCircle className="h-12 w-12 text-red-500" />;
      default:
        return <AlertCircle className="h-12 w-12 text-red-500" />;
    }
  };

  const getErrorBadgeColor = () => {
    switch (error?.type) {
      case "network":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "payment":
        return "bg-red-100 text-red-800 border-red-200";
      case "validation":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "timeout":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "system":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-red-100 text-red-800 border-red-200";
    }
  };

  if (!error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading error details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        {/* Error Header */}
        <Card className="text-center mb-6">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              {getErrorIcon()}
            </div>
            <CardTitle className="text-2xl text-red-600">
              Payment Failed
            </CardTitle>
            <p className="text-muted-foreground">
              We couldn't process your payment
            </p>
          </CardHeader>
          <CardContent>
            <Badge className={getErrorBadgeColor()}>
              {error.code || "PAYMENT_ERROR"}
            </Badge>
          </CardContent>
        </Card>

        {/* Error Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What Happened?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">{error.message}</h4>
              <p className="text-sm text-red-700">{error.details}</p>
            </div>

            {bookingId && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Booking ID:</span> {bookingId}
              </div>
            )}

            {paymentId && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Payment ID:</span> {paymentId}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Timestamp:</span>{" "}
              {new Date().toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">What You Can Do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error.retryable && (
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium">Try Again</h4>
                  <p className="text-sm text-muted-foreground">
                    Click the retry button to attempt the payment again.
                    {state.attempt > 0 &&
                      ` You've tried ${state.attempt} time${state.attempt > 1 ? "s" : ""}.`}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Check Payment Method</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure your card details are correct, have sufficient funds,
                  and aren't blocked for online transactions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Start New Booking</h4>
                <p className="text-sm text-muted-foreground">
                  If retrying doesn't work, you can start a new booking from
                  scratch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Contact Support</h4>
                <p className="text-sm text-muted-foreground">
                  Our support team is available 24/7 to help you resolve payment
                  issues.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {error.retryable && (
                <Button
                  onClick={handleRetryPayment}
                  disabled={state.isRetrying || !state.canRetry}
                  className="w-full"
                >
                  {state.isRetrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Payment ({3 - state.attempt} left)
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleStartNewBooking}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Start New Booking
              </Button>

              <Button
                onClick={handleContactSupport}
                variant="outline"
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/user/bookings">
                  <Search className="w-4 h-4 mr-2" />
                  My Bookings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>Hotline: 1900-1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>Email: support@busticket.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>24/7 Support Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span>Secure Payment Guaranteed</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> No charges were made to your payment
                method. Your booking was not confirmed and no seats were
                reserved.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
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
      <PaymentFailurePageContent />
    </Suspense>
  );
}
