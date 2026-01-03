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
  useSubmitFeedback,
  useCompletedBookingForTrip,
  useHasUserReviewed
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
import { toast } from "react-hot-toast";

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
  const { data: completedBooking, isLoading: isLoadingBooking } = useCompletedBookingForTrip(tripId);
  
  // Only check can review when we have a completed booking
  const { data: canReviewData, isLoading: isCheckingEligibility } = useCanLeaveFeedback(
    completedBooking?.id || ""
  );
  
  // C4: Enhanced hooks for duplicate prevention and review existence check
  const submitFeedback = useSubmitFeedback();
  const { data: hasUserReviewed, isLoading: isCheckingReviewed } = useHasUserReviewed(tripId);
  
  // C2: Loading and error states
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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

  const isLoading = isLoadingUser || isLoadingFeedback || isCheckingEligibility || isLoadingBooking || isCheckingReviewed;
  const isFormSubmitting = submitFeedback.isPending || isSubmitting;

  // C4: Enhanced form submission handler with duplicate prevention
  const handleFormSubmit = async (data: ReviewFormData) => {
    if (!completedBooking) {
      toast.error("No completed booking found for this trip");
      return;
    }

    // C4: Check if user has already reviewed
    if (hasUserReviewed) {
      toast.error("You have already reviewed this trip");
      return;
    }

    // C2: Disable submit when rating not selected
    if (!data.rating || data.rating < 1) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // C4: Use enhanced submit with optimistic updates and error handling
      await submitFeedback.mutateAsync({
        bookingId: completedBooking.id,
        tripId,
        feedbackData: {
          rating: data.rating,
          comment: data.comment || undefined,
        },
      });
      
      // C2: Reset form after successful submission
      reset();
      
      // C2: Show success toast (handled by the hook)
      // C4: Form will be hidden automatically due to hasUserReviewed becoming true
      
      // C2: Refresh review list via onSuccess callback
      onSuccess?.();
    } catch (error) {
      // C4: Error handling - errors are handled in the enhanced mutation hook
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Login Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link> to leave a review.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // C4: User already has feedback (either existing feedback or detected through hasUserReviewed)
  if (existingFeedback || hasUserReviewed) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Review Submitted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {existingFeedback ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Rating:</span>
                <RatingStars 
                  rating={existingFeedback.rating} 
                  readonly
                  size="sm"
                  showLabel={false}
                />
              </div>

              {existingFeedback.comment && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Your Comment:</span>
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-sm leading-relaxed">{existingFeedback.comment}</p>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Submitted on {new Date(existingFeedback.createdAt).toLocaleDateString()}
              </div>
            </>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Thank you for your review!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Check if user can review
  if (canReviewData && !canReviewData.canReview) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Unable to Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {canReviewData.reason || "You cannot review this trip at this time. Please complete your booking first."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show review form
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-4 w-4" />
          Share Your Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={field.value || 0}
                        onRatingChange={field.onChange}
                        size="default"
                        showLabel={false}
                      />
                      {field.value > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {field.value} {field.value === 1 ? 'star' : 'stars'}
                        </span>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Comment (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your experience..."
                      className="min-h-20 resize-none text-sm"
                      maxLength={maxCommentLength}
                      disabled={isFormSubmitting}
                    />
                  </FormControl>
                  <div className="flex justify-end">
                    <span className={cn(
                      "text-xs tabular-nums",
                      remainingChars < 50 ? "text-orange-500" : "text-muted-foreground"
                    )}>
                      {commentLength}/{maxCommentLength}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={isFormSubmitting || !watchedRating || watchedRating === 0 || !completedBooking}
                className="flex-1"
                size="sm"
              >
                {isFormSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => reset()}
                disabled={isFormSubmitting}
              >
                Clear
              </Button>
            </div>

            {!watchedRating || watchedRating === 0 ? (
              <p className="text-xs text-muted-foreground">
                Please select a rating to submit your review
              </p>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}