"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/ui/rating-stars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  useCurrentUser 
} from "@/hooks/useAuth";
import { 
  useFeedbackForTrip, 
  useCanLeaveFeedback, 
  useSubmitFeedback 
} from "@/hooks/useFeedback";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Star, 
  MessageSquare, 
  Loader2,
  User
} from "lucide-react";
import Link from "next/link";

const reviewFormSchema = z.object({
  rating: z
    .number({ required_error: "Please select a rating" })
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),
  comment: z
    .string()
    .max(500, "Comment cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface AuthenticatedReviewFormProps {
  tripId: string;
  tripDetails?: {
    routeName: string;
    date: string;
    busOperator: string;
    departureTime: string;
    arrivalTime: string;
  };
  maxCommentLength?: number;
  className?: string;
  onSuccess?: () => void;
}

export function AuthenticatedReviewForm({
  tripId,
  tripDetails,
  maxCommentLength = 500,
  className,
  onSuccess,
}: AuthenticatedReviewFormProps) {
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: existingFeedback, isLoading: isLoadingFeedback } = useFeedbackForTrip(tripId);
  const { data: canReviewData, isLoading: isCheckingEligibility } = useCanLeaveFeedback(tripId);
  const submitFeedback = useSubmitFeedback();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(
      reviewFormSchema.extend({
        comment: z
          .string()
          .max(maxCommentLength, `Comment cannot exceed ${maxCommentLength} characters`)
          .optional()
          .or(z.literal("")),
      })
    ),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const { watch, handleSubmit, reset } = form;
  const watchedComment = watch("comment");
  const watchedRating = watch("rating");
  
  const commentLength = watchedComment?.length || 0;
  const remainingChars = maxCommentLength - commentLength;

  const isLoading = isLoadingUser || isLoadingFeedback || isCheckingEligibility;
  const isSubmitting = submitFeedback.isPending;

  const handleFormSubmit = async (data: ReviewFormData) => {
    try {
      await submitFeedback.mutateAsync({
        tripId,
        feedbackData: {
          rating: data.rating,
          comment: data.comment || undefined,
        },
      });
      
      reset();
      onSuccess?.();
    } catch (error) {
      // Error is handled in the mutation
      console.error("Failed to submit review:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-2xl", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading review form...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <Card className={cn("w-full max-w-2xl", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              You need to be logged in to leave a review. 
              <Link 
                href="/login" 
                className="ml-1 text-primary hover:underline font-medium"
              >
                Please log in
              </Link> to continue.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // User already has feedback
  if (existingFeedback) {
    return (
      <Card className={cn("w-full max-w-2xl", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Your Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tripDetails && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h3 className="font-medium">{tripDetails.routeName}</h3>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>{tripDetails.date}</span>
                <span>•</span>
                <span>{tripDetails.busOperator}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Rating:</span>
              <RatingStars 
                rating={existingFeedback.rating} 
                readonly
                size="default"
                showLabel
              />
            </div>

            {existingFeedback.comment && (
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Your Feedback:
                </span>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm leading-relaxed">{existingFeedback.comment}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Submitted on {new Date(existingFeedback.submittedAt).toLocaleDateString()}
              </span>
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Review Complete
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if user can review
  if (canReviewData && !canReviewData.canReview) {
    return (
      <Card className={cn("w-full max-w-2xl", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Unable to Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {canReviewData.reason || "You cannot review this trip at this time."}
              {canReviewData.tripStatus && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Trip Status: <Badge variant="outline" className="text-xs">
                    {canReviewData.tripStatus}
                  </Badge>
                </div>
              )}
              {canReviewData.bookingStatus && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Booking Status: <Badge variant="outline" className="text-xs">
                    {canReviewData.bookingStatus}
                  </Badge>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show review form
  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Rate Your Experience
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tripDetails && (
          <div className="mb-6 rounded-lg bg-muted/50 p-4 space-y-2">
            <h3 className="font-medium">{tripDetails.routeName}</h3>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span>{tripDetails.date}</span>
              <span>•</span>
              <span>{tripDetails.busOperator}</span>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Departure: {tripDetails.departureTime}</span>
              <span>•</span>
              <span>Arrival: {tripDetails.arrivalTime}</span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    How would you rate your experience?
                  </FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <RatingStars
                        rating={field.value || 0}
                        onRatingChange={field.onChange}
                        size="lg"
                        showLabel
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Select a rating from 1 to 5 stars
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Share your feedback (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about your experience..."
                      className="min-h-32 resize-none"
                      maxLength={maxCommentLength}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormDescription>
                      Help others by sharing your detailed experience
                    </FormDescription>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        remainingChars < 50
                          ? "text-orange-500"
                          : remainingChars < 20
                          ? "text-red-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {commentLength}/{maxCommentLength}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !watchedRating || watchedRating === 0}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </div>

            {!watchedRating || watchedRating === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select a rating to submit your review
                </AlertDescription>
              </Alert>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}