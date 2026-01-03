"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/ui/rating-stars";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

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

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  defaultValues?: Partial<ReviewFormData>;
  className?: string;
  tripId?: string;
  showTripInfo?: boolean;
  maxCommentLength?: number;
}

export function ReviewForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  className,
  tripId,
  showTripInfo = false,
  maxCommentLength = 500,
}: ReviewFormProps) {
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
      rating: defaultValues?.rating || 0,
      comment: defaultValues?.comment || "",
    },
  });

  const { watch, handleSubmit, formState } = form;
  const watchedComment = watch("comment");
  const watchedRating = watch("rating");
  
  const commentLength = watchedComment?.length || 0;
  const remainingChars = maxCommentLength - commentLength;

  const handleFormSubmit = async (data: ReviewFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling can be implemented here
      console.error("Failed to submit review:", error);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {showTripInfo && tripId && (
        <div className="rounded-lg bg-muted/50 p-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Reviewing Trip: {tripId}
          </h3>
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
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Clear
            </Button>
          </div>

          {!watchedRating || watchedRating === 0 ? (
            <p className="text-sm text-muted-foreground">
              Please select a rating to submit your review
            </p>
          ) : null}
        </form>
      </Form>
    </div>
  );
}