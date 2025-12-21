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

export const useFeedbackForTrip = (tripId: string) => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["feedback", tripId],
    queryFn: () => feedbackService.getFeedbackForTrip(tripId),
    enabled: !!user && !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCanLeaveFeedback = (tripId: string) => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["canLeaveFeedback", tripId],
    queryFn: () => feedbackService.canLeaveFeedback(tripId),
    enabled: !!user && !!tripId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

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
    onSuccess: (data, variables) => {
      // Update the feedback cache with C1 API format
      queryClient.setQueryData(["feedback", variables.tripId], {
        id: data.id,
        rating: data.rating,
        comment: data.comment,
        submittedAt: data.createdAt, // Map createdAt to submittedAt for compatibility
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["canLeaveFeedback", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["userFeedback"] });
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });

      toast.success("Thank you for your feedback!");
    },
    onError: (error: any) => {
      // C1 API Contract: Handle standardized error responses
      const errorMessage = error.response?.data?.message || "Failed to submit feedback";
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
          break;
        case 400:
          toast.error(Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage);
          break;
        default:
          toast.error(errorMessage);
      }
    },
  });
};

export const useUpdateFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId, feedbackData, tripId }: { 
      feedbackId: string; 
      feedbackData: Partial<FeedbackData>;
      tripId: string;
    }) => feedbackService.updateFeedback(feedbackId, feedbackData),
    onSuccess: (data, variables) => {
      // Update the feedback cache
      queryClient.setQueryData(["feedback", variables.tripId], {
        id: data.id,
        rating: data.rating,
        comment: data.comment,
        submittedAt: data.createdAt, // Map createdAt to submittedAt for compatibility
      });

      toast.success("Feedback updated successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to update feedback";
      toast.error(errorMessage);
    },
  });
};

export const useUserFeedback = () => {
  const { data: user } = useCurrentUser();

  return useQuery({
    queryKey: ["userFeedback"],
    queryFn: feedbackService.getUserFeedback,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ feedbackId, tripId }: { feedbackId: string; tripId: string }) =>
      feedbackService.deleteFeedback(feedbackId),
    onSuccess: (_, variables) => {
      // Remove from cache
      queryClient.setQueryData(["feedback", variables.tripId], null);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["canLeaveFeedback", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["userFeedback"] });

      toast.success("Feedback deleted successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to delete feedback";
      toast.error(errorMessage);
    },
  });
};

// C3: Hook for trip reviews with pagination
export const useTripReviews = (tripId: string, params: Omit<ReviewsListParams, 'tripId'> = {}) => {
  return useQuery({
    queryKey: ["tripReviews", tripId, params],
    queryFn: () => feedbackService.getTripReviews({ tripId, ...params }),
    enabled: !!tripId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for route reviews with pagination
// C3: Hook for trip review statistics (average rating, total count)
export const useTripReviewStats = (tripId: string) => {
  return useQuery({
    queryKey: ["tripReviewStats", tripId],
    queryFn: () => feedbackService.getReviewStats(tripId, 'trip'),
    enabled: !!tripId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRouteReviews = (routeId: string, params: ReviewsListParams = {}) => {
  return useQuery({
    queryKey: ["routeReviews", routeId, params],
    queryFn: () => feedbackService.getRouteReviews({ routeId, ...params }),
    enabled: !!routeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for all reviews with pagination (admin/public view)
export const useAllReviews = (params: ReviewsListParams = {}) => {
  return useQuery({
    queryKey: ["allReviews", params],
    queryFn: () => feedbackService.getAllReviews(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook for infinite scroll loading of reviews
export const useInfiniteTripReviews = (
  tripId: string,
  params: Omit<ReviewsListParams, 'tripId' | 'page'> = {}
) => {
  return useInfiniteQuery({
    queryKey: ["infiniteTripReviews", tripId, params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      feedbackService.getTripReviews({
        tripId,
        ...params,
        page: pageParam as number,
      }),
    enabled: !!tripId,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });
};

export const useInfiniteRouteReviews = (
  routeId: string,
  params: Omit<ReviewsListParams, 'routeId' | 'page'> = {}
) => {
  return useInfiniteQuery({
    queryKey: ["infiniteRouteReviews", routeId, params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      feedbackService.getRouteReviews({
        routeId,
        ...params,
        page: pageParam as number,
      }),
    enabled: !!routeId,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for review statistics
export const useReviewStats = (id: string, type: 'trip' | 'route') => {
  return useQuery({
    queryKey: ["reviewStats", type, id],
    queryFn: () => feedbackService.getReviewStats(id, type),
    enabled: !!id && !!type,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};