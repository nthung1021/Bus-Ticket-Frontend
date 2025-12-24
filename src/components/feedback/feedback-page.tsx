"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthenticatedReviewForm } from "./authenticated-review-form";
import { 
  CheckCircle, 
  Star, 
  Clock, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Calendar,
  MapPin,
  Bus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackPageProps {
  tripId: string;
  bookingId?: string;
  tripData?: {
    id: string;
    routeName: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    date: string;
    busOperator: string;
    busModel: string;
    plateNumber: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  };
  bookingData?: {
    id: string;
    status: 'pending' | 'paid' | 'cancelled' | 'expired';
    bookedAt: string;
    totalAmount: number;
    reference: string;
  };
  onBack?: () => void;
  className?: string;
}

export function FeedbackPage({
  tripId,
  bookingId,
  tripData,
  bookingData,
  onBack,
  className,
}: FeedbackPageProps) {
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);

  const handleReviewSuccess = () => {
    setShowSuccessMessage(true);
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  const getStatusInfo = () => {
    if (!tripData || !bookingData) return null;

    const tripStatus = tripData.status;
    const bookingStatus = bookingData.status;

    // Success state - can review
    if (tripStatus === 'completed' && bookingStatus === 'paid') {
      return {
        type: 'success',
        title: 'Ready to Review',
        description: 'Your trip has been completed. Please share your experience!',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
      };
    }

    // Trip not completed yet
    if (tripStatus !== 'completed') {
      const statusLabels = {
        scheduled: 'Scheduled',
        in_progress: 'In Progress', 
        cancelled: 'Cancelled',
        delayed: 'Delayed'
      };

      return {
        type: 'pending',
        title: `Trip ${statusLabels[tripStatus]}`,
        description: tripStatus === 'cancelled' 
          ? 'This trip has been cancelled and cannot be reviewed.'
          : 'You can leave a review once your trip is completed.',
        icon: tripStatus === 'cancelled' ? XCircle : Clock,
        color: tripStatus === 'cancelled' ? 'text-red-600' : 'text-orange-600',
        bgColor: tripStatus === 'cancelled' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200',
      };
    }

    // Booking not paid
    if (bookingStatus !== 'paid') {
      const statusLabels = {
        pending: 'Payment Pending',
        cancelled: 'Booking Cancelled',
        expired: 'Booking Expired'
      };

      return {
        type: 'error',
        title: statusLabels[bookingStatus],
        description: 'Only passengers with confirmed bookings can leave reviews.',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  const canShowReviewForm = tripData?.status === 'completed' && bookingData?.status === 'paid';

  return (
    <div className={cn("container mx-auto py-6 max-w-4xl", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Trip Review</h1>
            <p className="text-muted-foreground">Share your travel experience</p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thank you for your feedback! Your review has been submitted successfully.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trip Details Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bus className="h-5 w-5" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tripData ? (
                <>
                  {/* Route */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" />
                      Route
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tripData.origin} → {tripData.destination}
                    </div>
                    <div className="text-lg font-semibold">
                      {tripData.routeName}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="h-4 w-4" />
                      Date & Time
                    </div>
                    <div className="text-sm space-y-1">
                      <div>{tripData.date}</div>
                      <div className="text-muted-foreground">
                        {tripData.departureTime} - {tripData.arrivalTime}
                      </div>
                    </div>
                  </div>

                  {/* Bus Info */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Bus Information</div>
                    <div className="text-sm space-y-1">
                      <div>{tripData.busOperator}</div>
                      <div className="text-muted-foreground">
                        {tripData.busModel} • {tripData.plateNumber}
                      </div>
                    </div>
                  </div>

                  {/* Booking Info */}
                  {bookingData && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="text-sm font-medium">Booking Details</div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reference:</span>
                          <span className="font-mono text-xs">{bookingData.reference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge 
                            variant={bookingData.status === 'paid' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {bookingData.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span>${bookingData.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Info */}
                  {statusInfo && (
                    <div className={cn("p-3 rounded-lg border", statusInfo.bgColor)}>
                      <div className="flex items-center gap-2 mb-1">
                        <statusInfo.icon className={cn("h-4 w-4", statusInfo.color)} />
                        <span className={cn("text-sm font-medium", statusInfo.color)}>
                          {statusInfo.title}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {statusInfo.description}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Loading trip details...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Form */}
        <div className="lg:col-span-2">
          {canShowReviewForm ? (
            <AuthenticatedReviewForm
              tripId={tripId}
              tripDetails={tripData ? {
                routeName: tripData.routeName,
                date: tripData.date,
                busOperator: tripData.busOperator,
                departureTime: tripData.departureTime,
                arrivalTime: tripData.arrivalTime,
              } : undefined}
              onSuccess={handleReviewSuccess}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-muted-foreground" />
                  Review Not Available
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {tripData?.status !== 'completed' 
                      ? "You can leave a review once your trip is completed."
                      : bookingData?.status !== 'paid'
                      ? "Only passengers with confirmed bookings can leave reviews."
                      : "Review is not available for this trip."
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}