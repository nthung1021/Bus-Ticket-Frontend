import * as React from "react";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { 
  feedbackService, 
  type FeedbackData, 
  type ReviewsListParams,
  type SortBy 
} from "@/services/feedback.service";
import { userBookingService } from "@/services/userBookingService";
import { useCurrentUser } from "./useAuth";
import { toast } from "react-hot-toast";

// Hook to get trip reviews with optional parameters
export const useTripReviews = (tripId: string, params: ReviewsListParams = {}) => {
  return useQuery({
    queryKey: ["tripReviews", tripId, params],
    queryFn: () => feedbackService.getTripReviews(tripId, params),
    enabled: !!tripId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Hook to get route reviews (assuming this is same as trip reviews)
export const useRouteReviews = (tripId: string, params: ReviewsListParams = {}) => {
  return useTripReviews(tripId, params);
};

// Hook to get all reviews
export const useAllReviews = (params: ReviewsListParams = {}) => {
  return useQuery({
    queryKey: ["allReviews", params],
    queryFn: () => feedbackService.getAllReviews(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Hook to get trip review stats
export const useTripReviewStats = (tripId?: string) => {
  return useQuery({
    queryKey: ["tripReviewStats", tripId],
    queryFn: () => feedbackService.getReviewStats(tripId),
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Infinite scroll hooks for large lists
export const useInfiniteTripReviews = (tripId: string, params: Omit<ReviewsListParams, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: ["infiniteTripReviews", tripId, params],
    queryFn: ({ pageParam = 1 }) => 
      feedbackService.getTripReviews(tripId, { ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    enabled: !!tripId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};

export const useInfiniteRouteReviews = (tripId: string, params: Omit<ReviewsListParams, 'page'> = {}) => {
  return useInfiniteTripReviews(tripId, params);
};

export const useCompletedBookingForTrip = (tripId: string) => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["completedBookingForTrip", tripId],
    queryFn: () => userBookingService.getCompletedBookingForTrip(tripId),
    enabled: !!user && !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// C4: Hook to check if user has already reviewed a trip
export const useHasUserReviewed = (tripId: string) => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["hasUserReviewed", tripId],
    queryFn: async () => {
      // Check if user has already reviewed this trip by looking at their reviews
      const response = await feedbackService.getTripReviews(tripId, {
        page: 1, 
        limit: 100 // Get enough to check if user's review exists
      });
      
      // Check if any review belongs to current user (by name matching)
      return response.reviews.some(review => 
        user && review.user.name === user.name
      );
    },
    enabled: !!user && !!tripId,
    staleTime: 30 * 1000, // 30 seconds - short cache for accurate state
    retry: 1,
  });
};

export const useFeedbackForTrip = (tripId: string) => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["feedback", tripId],
    queryFn: () => feedbackService.getFeedbackForTrip(tripId),
    enabled: !!user && !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCanLeaveFeedback = (bookingId: string) => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["canLeaveFeedback", bookingId],
    queryFn: () => feedbackService.canLeaveFeedback(bookingId),
    enabled: !!user && !!bookingId && bookingId.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  return useMutation({
    mutationFn: ({ 
      bookingId, 
      tripId, 
      feedbackData 
    }: { 
      bookingId: string;
      tripId: string; 
      feedbackData: Omit<FeedbackData, 'bookingId' | 'tripId'>;
    }) => feedbackService.submitFeedback(bookingId, tripId, feedbackData),
    onMutate: async (variables) => {
      // C4: Optimistic update - immediately show the review
      await queryClient.cancelQueries({ queryKey: ["tripReviews", variables.tripId] });
      await queryClient.cancelQueries({ queryKey: ["tripReviewStats", variables.tripId] });
      
      // Get current reviews data
      const previousReviews = queryClient.getQueryData(["tripReviews", variables.tripId]);
      const previousStats = queryClient.getQueryData(["tripReviewStats", variables.tripId]);
      
      if (user && previousReviews && typeof previousReviews === 'object' && 'reviews' in previousReviews) {
        // Create optimistic review
        const optimisticReview = {
          id: `temp-${Date.now()}`, // Temporary ID
          rating: variables.feedbackData.rating,
          comment: variables.feedbackData.comment,
          createdAt: new Date().toISOString(),
          user: { name: user.name }
        };
        
        // Add to reviews list
        const updatedReviews = {
          ...previousReviews,
          reviews: [optimisticReview, ...(previousReviews as any).reviews],
          pagination: {
            ...(previousReviews as any).pagination,
            total: (previousReviews as any).pagination.total + 1
          }
        };
        
        queryClient.setQueryData(["tripReviews", variables.tripId], updatedReviews);
        
        // Update stats optimistically
        if (previousStats && typeof previousStats === 'object' && 'averageRating' in previousStats && 'totalReviews' in previousStats) {
          const newTotalReviews = (previousStats as any).totalReviews + 1;
          const newAverageRating = (
            ((previousStats as any).averageRating * (previousStats as any).totalReviews + variables.feedbackData.rating) / 
            newTotalReviews
          );
          
          queryClient.setQueryData(["tripReviewStats", variables.tripId], {
            ...previousStats,
            totalReviews: newTotalReviews,
            averageRating: newAverageRating,
            ratingDistribution: {
              ...(previousStats as any).ratingDistribution,
              [variables.feedbackData.rating]: ((previousStats as any).ratingDistribution[variables.feedbackData.rating] || 0) + 1
            }
          });
        }
      }
      
      return { previousReviews, previousStats };
    },
    onSuccess: (data, variables, context) => {
      // C4: Update with actual server response
      queryClient.setQueryData(["feedback", variables.tripId], {
        id: data.id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt,
      });

      // Mark user as having reviewed this trip
      queryClient.setQueryData(["hasUserReviewed", variables.tripId], true);
      
      // Invalidate and refetch related queries for accuracy
      queryClient.invalidateQueries({ queryKey: ["canLeaveFeedback", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["userFeedback"] });
      queryClient.invalidateQueries({ queryKey: ["tripReviews", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["tripReviewStats", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["reviewStats", "trip", variables.tripId] });

      toast.success("Thank you for your review!");
    },
    onError: (error: any, variables, context) => {
      // C4: Rollback optimistic updates on error
      if (context?.previousReviews) {
        queryClient.setQueryData(["tripReviews", variables.tripId], context.previousReviews);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(["tripReviewStats", variables.tripId], context.previousStats);
      }
      
      // C4: Enhanced error handling with specific messages
      const errorMessage = error.response?.data?.message || "Failed to submit review";
      const errorCode = error.response?.status;
      
      switch (errorCode) {
        case 401:
          toast.error("Please log in to submit a review");
          break;
        case 403:
          toast.error("You can only review completed bookings that belong to you");
          break;
        case 409:
          toast.error("You have already reviewed this booking");
          // Update the hasUserReviewed cache to reflect this
          queryClient.setQueryData(["hasUserReviewed", variables.tripId], true);
          break;
        case 400:
          toast.error(Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage);
          break;
        case 429:
          toast.error("Too many requests. Please try again later.");
          break;
        default:
          toast.error(`Network error: ${errorMessage}. Please check your connection and try again.`);
      }
    },
    retry: (failureCount, error) => {
      // C4: Smart retry logic - only retry on network errors, not business logic errors
      const errorCode = error?.response?.status;
      if (errorCode && errorCode >= 400 && errorCode < 500) {
        return false; // Don't retry client errors
      }
      return failureCount < 2; // Retry up to 2 times for network/server errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, feedbackData, tripId }: { 
      reviewId: string; 
      feedbackData: Partial<FeedbackData>;
      tripId: string;
    }) => feedbackService.updateReview(reviewId, feedbackData),
    onSuccess: (data, variables) => {
      // Update the feedback cache
      queryClient.setQueryData(["feedback", variables.tripId], {
        id: data.id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt, // Use createdAt consistently
      });

      toast.success("Review updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to update review";
      toast.error(errorMessage);
    },
  });
};

export const useMyReviews = (params: ReviewsListParams = {}) => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["myReviews", params],
    queryFn: () => feedbackService.getMyReviews(params),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, tripId }: { reviewId: string; tripId: string }) =>
      feedbackService.deleteReview(reviewId),
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.setQueryData(["feedback", variables.tripId], null);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["canLeaveFeedback"] });
      queryClient.invalidateQueries({ queryKey: ["myReviews"] });
      queryClient.invalidateQueries({ queryKey: ["hasUserReviewed", variables.tripId] });

      toast.success("Review deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to delete review";
      toast.error(errorMessage);
    },
  });
};











