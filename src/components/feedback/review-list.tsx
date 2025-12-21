"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RatingStars } from "@/components/ui/rating-stars";
import { 
  useTripReviews, 
  useRouteReviews, 
  useAllReviews,
  useInfiniteTripReviews,
  useInfiniteRouteReviews
} from "@/hooks/useFeedback";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  User, 
  Calendar,
  ChevronDown,
  Loader2,
  Star,
  Filter,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ReviewWithUser, SortBy, ReviewsListParams } from "@/services/feedback.service";

interface ReviewCardProps {
  review: ReviewWithUser;
  className?: string;
}

function ReviewCard({ review, className }: ReviewCardProps) {
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown date";
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <Avatar className="h-10 w-10 border">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getUserInitials(review.user.fullName)}
            </AvatarFallback>
          </Avatar>

          {/* Review Content */}
          <div className="flex-1 space-y-3">
            {/* Header: User & Rating */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-sm">{review.user.fullName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <RatingStars 
                    rating={review.rating} 
                    readonly 
                    size="sm"
                  />
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {review.rating}.0
                  </Badge>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(review.submittedAt)}
              </div>
            </div>

            {/* Comment */}
            {review.comment && (
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {review.comment}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {review.comment ? "With comment" : "Rating only"}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {new Date(review.submittedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SortControlsProps {
  sortBy: SortBy;
  onSortChange: (sortBy: SortBy) => void;
  totalCount?: number;
}

function SortControls({ sortBy, onSortChange, totalCount }: SortControlsProps) {
  const sortOptions = [
    { value: "newest" as SortBy, label: "Newest First" },
    { value: "oldest" as SortBy, label: "Oldest First" },
    { value: "highest_rating" as SortBy, label: "Highest Rating" },
    { value: "lowest_rating" as SortBy, label: "Lowest Rating" },
  ];

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Sort by:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {totalCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {totalCount} review{totalCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

function PaginationControls({ 
  currentPage, 
  totalPages, 
  hasNext, 
  hasPrev, 
  onPageChange, 
  isLoading 
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev || isLoading}
      >
        Previous
      </Button>
      
      <div className="flex items-center gap-1 px-3">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext || isLoading}
      >
        Next
      </Button>
    </div>
  );
}

function ReviewListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ReviewListProps {
  // Data source configuration
  tripId?: string;
  routeId?: string;
  showAll?: boolean; // For admin/public view of all reviews
  
  // Display options
  title?: string;
  showHeader?: boolean;
  showSortControls?: boolean;
  showPagination?: boolean;
  useInfiniteScroll?: boolean;
  
  // Pagination settings
  initialLimit?: number;
  
  // Styling
  className?: string;
  cardClassName?: string;
}

export function ReviewList({
  tripId,
  routeId,
  showAll = false,
  title,
  showHeader = true,
  showSortControls = true,
  showPagination = true,
  useInfiniteScroll = false,
  initialLimit = 10,
  className,
  cardClassName,
}: ReviewListProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortBy, setSortBy] = React.useState<SortBy>("newest");
  const [limit] = React.useState(initialLimit);

  const queryParams = { page: currentPage, limit, sortBy };

  // Choose the appropriate hook based on data source
  const tripReviews = useTripReviews(
    tripId!,
    queryParams,
  );
  
  const routeReviews = useRouteReviews(
    routeId!,
    queryParams,
  );
  
  const allReviews = useAllReviews(
    queryParams,
  );

  const infiniteTripReviews = useInfiniteTripReviews(
    tripId!,
    { limit, sortBy }
  );
  
  const infiniteRouteReviews = useInfiniteRouteReviews(
    routeId!,
    { limit, sortBy }
  );

  // Select the active query based on configuration
  const activeQuery = React.useMemo(() => {
    if (useInfiniteScroll) {
      if (tripId) return { type: 'infinite', query: infiniteTripReviews };
      if (routeId) return { type: 'infinite', query: infiniteRouteReviews };
      return null;
    } else {
      if (tripId) return { type: 'paginated', query: tripReviews };
      if (routeId) return { type: 'paginated', query: routeReviews };
      if (showAll) return { type: 'paginated', query: allReviews };
      return null;
    }
  }, [tripId, routeId, showAll, useInfiniteScroll, tripReviews, routeReviews, allReviews, infiniteTripReviews, infiniteRouteReviews]);

  if (!activeQuery) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          ReviewList requires either tripId, routeId, or showAll to be specified.
        </AlertDescription>
      </Alert>
    );
  }

  const { type, query } = activeQuery;
  const isLoading = query.isLoading;
  const error = query.error;

  // Handle data extraction based on query type
  const reviewsData = React.useMemo(() => {
    if (type === 'infinite') {
      const infiniteQuery = query as typeof infiniteTripReviews;
      return {
        reviews: infiniteQuery.data?.pages.flatMap(page => page.reviews) || [],
        pagination: infiniteQuery.data?.pages[0]?.pagination || null,
        hasNextPage: infiniteQuery.hasNextPage,
        fetchNextPage: infiniteQuery.fetchNextPage,
        isFetchingNextPage: infiniteQuery.isFetchingNextPage,
      };
    } else {
      const paginatedQuery = query as typeof tripReviews;
      return {
        reviews: paginatedQuery.data?.reviews || [],
        pagination: paginatedQuery.data?.pagination || null,
        hasNextPage: false,
        fetchNextPage: () => {},
        isFetchingNextPage: false,
      };
    }
  }, [type, query]);

  const { reviews, pagination, hasNextPage, fetchNextPage, isFetchingNextPage } = reviewsData;

  const handleSortChange = (newSortBy: SortBy) => {
    setSortBy(newSortBy);
    if (!useInfiniteScroll) {
      setCurrentPage(1); // Reset to first page when sorting changes
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load reviews: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {showHeader && (
        <div className="space-y-4">
          {title && (
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
          )}
          
          {/* Sort Controls */}
          {showSortControls && (
            <SortControls
              sortBy={sortBy}
              onSortChange={handleSortChange}
              totalCount={pagination?.total}
            />
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && <ReviewListSkeleton />}

      {/* Reviews List */}
      {!isLoading && (
        <>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No reviews yet</h4>
                <p className="text-muted-foreground">
                  Be the first to share your experience!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  className={cardClassName}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Load More Button */}
          {useInfiniteScroll && hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-32"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Pagination Controls */}
          {showPagination && !useInfiniteScroll && pagination && pagination.totalPages > 1 && (
            <PaginationControls
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}