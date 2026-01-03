"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/ui/rating-stars";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { 
  useCurrentUser 
} from "@/hooks/useAuth";
import { 
  useSubmitFeedback,
  useCompletedBookingForTrip,
} from "@/hooks/useFeedback";
import { cn } from "@/lib/utils";
import { 
  Loader2,
  Star,
  User as UserIcon,
  CheckCircle,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

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

export type InlineReviewFormData = z.infer<typeof reviewFormSchema>;

interface InlineReviewFormProps {
  tripId: string;
  onSuccess?: () => void;
  className?: string;
}

export function InlineReviewForm({
  tripId,
  onSuccess,
  className,
}: InlineReviewFormProps) {
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: completedBooking, isLoading: isLoadingBooking, refetch: refetchBooking } = useCompletedBookingForTrip(tripId);
  const submitFeedback = useSubmitFeedback();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<InlineReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const { watch, handleSubmit, reset } = form;
  const watchedComment = watch("comment");
  const watchedRating = watch("rating");
  
  const commentLength = watchedComment?.length || 0;

  // Form submission handler
  const handleFormSubmit = async (data: InlineReviewFormData) => {
    // Must have completed booking
    if (!completedBooking?.id) {
      toast.error("You need to book this trip first before reviewing");
      return;
    }

    // Check if already reviewed
    if (completedBooking.review) {
      toast.error("You have already reviewed this booking");
      return;
    }

    // Must have rating
    if (!data.rating || data.rating < 1) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitFeedback.mutateAsync({
        bookingId: completedBooking.id,
        tripId,
        feedbackData: {
          rating: data.rating,
          comment: data.comment || undefined,
        },
      });
      
      // Reset form after successful submission
      reset();
      
      // Refetch booking to get updated review status
      await refetchBooking();
      
      // Call success callback
      onSuccess?.();
      
      toast.success("✅ Review submitted successfully! Thank you for your feedback.");
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      
      // Refetch booking to sync state even on error (especially 409)
      await refetchBooking();
      
      // Better error messages based on status code
      if (error?.response?.status === 409 || 
          error?.message?.includes("already reviewed") || 
          error?.message?.includes("already exists") ||
          error?.message?.includes("Review already exists")) {
        toast.error("❌ You have already reviewed this booking");
      } else if (error?.response?.status === 403) {
        toast.error("❌ You don't have permission to review this booking");
      } else if (error?.response?.status === 404) {
        toast.error("❌ Booking not found");
      } else {
        toast.error(error?.response?.data?.message || error?.message || "Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not authenticated
  if (!user && !isLoadingUser) {
    return (
      <Card className={cn("p-4 bg-muted/30", className)}>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Link href="/login" className="text-sm text-primary hover:underline font-medium">
              Log in to leave a review
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // No completed booking
  if (!completedBooking && !isLoadingBooking) {
    return (
      <Card className={cn("p-4 bg-muted/30", className)}>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Book this trip to leave a review
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Loading
  if (isLoadingUser || isLoadingBooking) {
    return (
      <Card className={cn("p-4 bg-muted/30", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </Card>
    );
  }

  // Already reviewed - show notification
  if (completedBooking?.review) {
    const formatReviewDate = (dateString: string) => {
      try {
        if (!dateString) return 'Recently';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateString);
          return 'Recently';
        }
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return 'Recently';
      }
    };

    return (
      <Card className={cn("p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800", className)}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                ✓ You've already reviewed this trip
              </h4>
              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                {completedBooking.review.rating} ⭐
              </Badge>
            </div>
            {completedBooking.review.comment && (
              <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                "{completedBooking.review.comment}"
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <Calendar className="h-3 w-3" />
              <span>
                Reviewed on {formatReviewDate(completedBooking.review.createdAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Each booking can only be reviewed once. Thank you for your feedback!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show review form
  return (
    <Card className={cn("p-4 bg-background border-2 border-primary/20", className)}>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              {/* Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Your rating:</span>
                        <RatingStars
                          rating={field.value || 0}
                          onRatingChange={field.onChange}
                          size="sm"
                          showLabel={false}
                        />
                        {field.value > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {field.value}/5
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comment */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share your experience with this trip..."
                        className="min-h-20 resize-none text-sm"
                        maxLength={500}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {commentLength}/500 characters
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !watchedRating || watchedRating === 0}
                  size="sm"
                  className="min-w-24"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Star className="h-3 w-3 mr-2" />
                      Post Review
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => reset()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}
