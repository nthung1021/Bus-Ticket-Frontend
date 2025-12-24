"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
  showLabel?: boolean;
}

const sizeVariants = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-6 w-6"
};

export function RatingStars({
  rating,
  onRatingChange,
  readonly = false,
  size = "default",
  className,
  showLabel = false
}: RatingStarsProps) {
  const [hoveredRating, setHoveredRating] = React.useState<number | null>(null);
  
  const handleClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleMouseEnter = (starRating: number) => {
    if (!readonly) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoveredRating(null);
    }
  };

  const displayRating = hoveredRating !== null ? hoveredRating : rating;

  const getRatingLabel = (rating: number): string => {
    const labels = {
      1: "Poor",
      2: "Fair", 
      3: "Good",
      4: "Very Good",
      5: "Excellent"
    };
    return labels[rating as keyof typeof labels] || "";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={cn(
              "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-sm",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                "transition-colors duration-150",
                sizeVariants[size],
                star <= displayRating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-muted-foreground hover:text-yellow-400"
              )}
            />
          </button>
        ))}
      </div>
      
      {showLabel && rating > 0 && (
        <span className="text-sm text-muted-foreground">
          {getRatingLabel(rating)}
        </span>
      )}
      
      {!readonly && hoveredRating && (
        <span className="text-sm text-muted-foreground">
          {getRatingLabel(hoveredRating)}
        </span>
      )}
    </div>
  );
}