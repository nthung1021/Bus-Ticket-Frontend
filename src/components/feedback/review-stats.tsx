"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/ui/rating-stars";
import { useTripReviewStats } from "@/hooks/useFeedback";
import { cn } from "@/lib/utils";
import { Star, TrendingUp, Users } from "lucide-react";

interface ReviewStatsProps {
  tripId?: string;
  id?: string;
  type?: "trip" | "route";
  title?: string;
  className?: string;
  showDistribution?: boolean;
}

export function ReviewStats({
  tripId,
  id,
  title,
  className,
  showDistribution = true,
}: ReviewStatsProps) {
  const effectiveTripId = tripId || id;
  const { data: stats, isLoading, error } = useTripReviewStats(effectiveTripId);

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {title || "Review Statistics"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-24" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
          
          {showDistribution && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No review statistics available</p>
        </CardContent>
      </Card>
    );
  }

  const { totalReviews, averageRating, ratingDistribution } = stats;

  // Calculate percentages for the rating distribution
  const distributionWithPercent = Object.entries(ratingDistribution)
    .map(([rating, count]) => ({
      rating: parseInt(rating),
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    }))
    .sort((a, b) => b.rating - a.rating); // Sort from 5 to 1 stars

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          {title || "Review Statistics"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Statistics */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {averageRating.toFixed(1)}
            </div>
            <RatingStars 
              rating={Math.round(averageRating)} 
              readonly 
              size="sm" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              out of 5
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Average rating: {averageRating.toFixed(2)}/5.0
              </span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        {showDistribution && totalReviews > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Rating Distribution
            </h4>
            
            <div className="space-y-3">
              {distributionWithPercent.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-xs font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-current text-yellow-400" />
                  </div>
                  
                  <div className="flex-1">
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 min-w-16">
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={averageRating >= 4.5 ? "default" : averageRating >= 3.5 ? "secondary" : "outline"}
            className="px-3 py-1"
          >
            {averageRating >= 4.5 
              ? "Excellent" 
              : averageRating >= 4.0 
              ? "Very Good" 
              : averageRating >= 3.5 
              ? "Good" 
              : averageRating >= 2.5 
              ? "Fair" 
              : "Poor"
            } • {totalReviews} review{totalReviews !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}