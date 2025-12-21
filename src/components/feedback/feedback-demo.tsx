"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  RatingStars, 
  ReviewForm, 
  UserReviewInterface,
  type ReviewFormData 
} from "@/components/feedback";

// Example usage of the feedback components
export function FeedbackDemo() {
  const [rating, setRating] = React.useState<number>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    busOperator: "Phuong Trang"
  };

  const existingReview = {
    rating: 4,
    comment: "Great service and comfortable seats. The driver was professional and the bus was clean. Would recommend to others!",
    submittedAt: new Date("2025-12-20")
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Feedback Components Demo</h1>
        
        {/* Rating Stars Component */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>RatingStars Component</CardTitle>
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
                  <h3 className="text-sm font-medium mb-2">Small Size (readonly)</h3>
                  <RatingStars rating={3} readonly size="sm" showLabel />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Default Size (readonly)</h3>
                  <RatingStars rating={4} readonly size="default" showLabel />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Large Size (readonly)</h3>
                  <RatingStars rating={5} readonly size="lg" showLabel />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Form Component */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ReviewForm Component</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              onSubmit={handleReviewSubmit}
              isSubmitting={isSubmitting}
              tripId="trip-123"
              showTripInfo={true}
              maxCommentLength={300}
            />
          </CardContent>
        </Card>

        {/* User Review Interface - New Review */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>UserReviewInterface - New Review</CardTitle>
          </CardHeader>
          <CardContent>
            <UserReviewInterface
              tripId="trip-456"
              tripDetails={tripDetails}
              onSubmitReview={handleUserReviewSubmit}
              maxCommentLength={400}
            />
          </CardContent>
        </Card>

        {/* User Review Interface - Existing Review */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>UserReviewInterface - Existing Review</CardTitle>
          </CardHeader>
          <CardContent>
            <UserReviewInterface
              tripId="trip-789"
              tripDetails={tripDetails}
              onSubmitReview={handleUserReviewSubmit}
              existingReview={existingReview}
            />
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">RatingStars Props:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>rating</code>: Current rating value (0-5)</li>
                <li><code>onRatingChange</code>: Callback when rating changes</li>
                <li><code>readonly</code>: Whether stars are clickable (default: false)</li>
                <li><code>size</code>: Star size - "sm", "default", or "lg"</li>
                <li><code>showLabel</code>: Show text label next to stars</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">ReviewForm Props:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>onSubmit</code>: Callback when form is submitted</li>
                <li><code>isSubmitting</code>: Loading state for submit button</li>
                <li><code>defaultValues</code>: Initial form values</li>
                <li><code>maxCommentLength</code>: Maximum characters for comment (default: 500)</li>
                <li><code>tripId</code>: Optional trip ID to display</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>✅ Interactive 1-5 star rating with hover effects</li>
                <li>✅ Form validation with Zod schema</li>
                <li>✅ Character counter for comments</li>
                <li>✅ Submit button disabled when no rating selected</li>
                <li>✅ Responsive design with Tailwind CSS</li>
                <li>✅ Accessibility features (ARIA labels, keyboard navigation)</li>
                <li>✅ TypeScript support with proper types</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FeedbackDemo;