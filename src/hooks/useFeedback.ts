import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackService, type FeedbackData } from "@/services/feedback.service";
import { useCurrentUser } from "./useAuth";
import { toast } from "react-hot-toast";

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
    mutationFn: ({ tripId, feedbackData }: { tripId: string; feedbackData: FeedbackData }) =>
      feedbackService.submitFeedback(tripId, feedbackData),
    onSuccess: (data, variables) => {
      // Update the feedback cache
      queryClient.setQueryData(["feedback", variables.tripId], {
        id: data.id,
        rating: data.rating,
        comment: data.comment,
        submittedAt: data.submittedAt,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["canLeaveFeedback", variables.tripId] });
      queryClient.invalidateQueries({ queryKey: ["userFeedback"] });

      toast.success("Thank you for your feedback!");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to submit feedback";
      toast.error(errorMessage);
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
        submittedAt: data.submittedAt,
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