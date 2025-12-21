"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  RatingStars, 
  ReviewForm, 
  UserReviewInterface,
  AuthenticatedReviewForm,
  FeedbackPage,
  type ReviewFormData 
} from "@/components/feedback";

// Example usage of the feedback components with authentication flow
export function FeedbackDemo() {
  const [rating, setRating] = React.useState<number>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeDemo, setActiveDemo] = React.useState<'components' | 'auth-form' | 'full-page'>('components');

  const handleReviewSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("Review submitted:", data);
    alert(`Review submitted! Rating: ${data.rating}, Comment: ${data.comment || "No comment"}`);
    
    setIsSubmitting(false);
  };

  const handleUserReviewSubmit = async (data: ReviewFormData & { tripId?: string }) => {
    console.log("User review submitted:", data);
    alert(`User review submitted for trip ${data.tripId}! Rating: ${data.rating}`);
  };

  const tripDetails = {
    routeName: "Ho Chi Minh City → Da Nang",
    date: "December 22, 2025",
    busOperator: "Phuong Trang",
    departureTime: "08:00 AM",
    arrivalTime: "02:00 PM"
  };

  const mockTripData = {
    id: "trip-123",
    routeName: "Ho Chi Minh City → Da Nang",
    origin: "Ho Chi Minh City",
    destination: "Da Nang",
    departureTime: "08:00 AM",
    arrivalTime: "02:00 PM", 
    date: "December 22, 2025",
    busOperator: "Phuong Trang",
    busModel: "Mercedes Sprinter",
    plateNumber: "59A-12345",
    status: 'completed' as const,
  };

  const mockBookingData = {
    id: "booking-456",
    status: 'paid' as const,
    bookedAt: "2025-12-20T10:00:00Z",
    totalAmount: 250000,
    reference: "BUS123456",
  };

  const existingReview = {
    rating: 4,
    comment: "Great service and comfortable seats. The driver was professional and the bus was clean. Would recommend to others!",
    submittedAt: new Date("2025-12-20")
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Feedback System Demo</h1>
        <p className="text-muted-foreground mb-8">
          Complete review submission flow with authentication, validation, and state management.
        </p>

        {/* Demo Navigation */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={activeDemo === 'components' ? 'default' : 'outline'}
            onClick={() => setActiveDemo('components')}
          >
            Basic Components
          </Button>
          <Button
            variant={activeDemo === 'auth-form' ? 'default' : 'outline'}
            onClick={() => setActiveDemo('auth-form')}
          >
            Authenticated Form
          </Button>
          <Button
            variant={activeDemo === 'full-page' ? 'default' : 'outline'}
            onClick={() => setActiveDemo('full-page')}
          >
            Complete Page
          </Button>
        </div>

        {/* Basic Components Demo */}
        {activeDemo === 'components' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>🌟 Basic Rating & Review Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Interactive Rating Stars</h3>
                    <RatingStars 
                      rating={rating} 
                      onRatingChange={setRating}
                      size="lg"
                      showLabel
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Current rating: {rating} stars
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Small (readonly)</h3>
                      <RatingStars rating={3} readonly size="sm" showLabel />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Default (readonly)</h3>
                      <RatingStars rating={4} readonly size="default" showLabel />
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Large (readonly)</h3>
                      <RatingStars rating={5} readonly size="lg" showLabel />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📝 Basic Review Form</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  onSubmit={handleReviewSubmit}
                  isSubmitting={isSubmitting}
                  tripId="trip-demo"
                  showTripInfo={true}
                  maxCommentLength={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>✅ Existing Review Display</CardTitle>
              </CardHeader>
              <CardContent>
                <UserReviewInterface
                  tripId="trip-existing"
                  tripDetails={tripDetails}
                  onSubmitReview={handleUserReviewSubmit}
                  existingReview={existingReview}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Authenticated Form Demo */}
        {activeDemo === 'auth-form' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>🔐 Authenticated Review Form</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Includes user authentication checks, booking status validation, and submission handling.
                </p>
              </CardHeader>
              <CardContent>
                <AuthenticatedReviewForm
                  tripId="trip-auth-demo"
                  tripDetails={tripDetails}
                  maxCommentLength={500}
                  onSuccess={() => {
                    console.log("Review submitted successfully!");
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Page Demo */}
        {activeDemo === 'full-page' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Complete Feedback Page</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Full-featured feedback page with trip details, booking validation, and review submission.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <FeedbackPage
                  tripId="trip-full-demo"
                  bookingId="booking-full-demo"
                  tripData={mockTripData}
                  bookingData={mockBookingData}
                  onBack={() => setActiveDemo('components')}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Implementation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Implementation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-green-600">✅ Features Implemented:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Authentication Check:</strong> Verifies user is logged in before showing form</li>
                <li><strong>Booking Status Validation:</strong> Only shows form if booking is PAID and trip is COMPLETED</li>
                <li><strong>Loading States:</strong> Shows loading spinner during form submission</li>
                <li><strong>Success/Error Messages:</strong> Toast notifications and alert components</li>
                <li><strong>Form Validation:</strong> Rating required, character limits, real-time feedback</li>
                <li><strong>State Management:</strong> React Query for caching and optimistic updates</li>
                <li><strong>Responsive Design:</strong> Works on mobile and desktop</li>
                <li><strong>Accessibility:</strong> ARIA labels, keyboard navigation, screen reader support</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2 text-blue-600">🔄 Submission Flow:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Check if user is authenticated (redirect to login if not)</li>
                <li>Validate booking status is PAID and trip status is COMPLETED</li>
                <li>Check if user has already submitted feedback</li>
                <li>Show review form with rating (required) and comment (optional)</li>
                <li>Validate form data on submission</li>
                <li>Show loading state while submitting</li>
                <li>Display success message or error message</li>
                <li>Update UI to show submitted review</li>
              </ol>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2 text-purple-600">🛠️ Usage Example:</h4>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
{`// In your booking history or trip details page
import { FeedbackPage } from "@/components/feedback";

export function TripDetailsPage({ tripId, bookingId }) {
  return (
    <FeedbackPage
      tripId={tripId}
      bookingId={bookingId}
      tripData={tripData}
      bookingData={bookingData}
      onBack={() => router.back()}
    />
  );
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FeedbackDemo;