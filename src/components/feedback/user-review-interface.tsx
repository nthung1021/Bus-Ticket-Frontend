"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm, type ReviewFormData } from "@/components/ui/review-form";
import { RatingStars } from "@/components/ui/rating-stars";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star } from "lucide-react";

interface UserReviewInterfaceProps {
  tripId?: string;
  tripDetails?: {
    routeName: string;
    date: string;
    busOperator: string;
  };
  onSubmitReview: (data: ReviewFormData & { tripId?: string }) => void | Promise<void>;
  isSubmitting?: boolean;
  existingReview?: {
    rating: number;
    comment?: string;
    submittedAt: Date;
  };
  maxCommentLength?: number;
}

export function UserReviewInterface({
  tripId,
  tripDetails,
  onSubmitReview,
  isSubmitting = false,
  existingReview,
  maxCommentLength = 500,
}: UserReviewInterfaceProps) {
  const handleSubmit = async (data: ReviewFormData) => {
    await onSubmitReview({ ...data, tripId });
  };

  if (existingReview) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
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
                rating={existingReview.rating} 
                readonly
                size="default"
                showLabel
              />
            </div>

            {existingReview.comment && (
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Your Feedback:
                </span>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm leading-relaxed">{existingReview.comment}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                Submitted on {existingReview.submittedAt.toLocaleDateString()}
              </span>
              <Badge variant="secondary" className="text-xs">
                Review Complete
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
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
          </div>
        )}

        <ReviewForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          tripId={tripId}
          maxCommentLength={maxCommentLength}
        />
      </CardContent>
    </Card>
  );
}