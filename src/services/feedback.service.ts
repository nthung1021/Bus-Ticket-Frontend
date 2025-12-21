import api from "@/lib/api";

export interface FeedbackData {
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  userId: string;
  tripId: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
}

export interface ExistingFeedback {
  id: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
}

export const feedbackService = {
  // Submit new feedback for a trip
  async submitFeedback(tripId: string, feedbackData: FeedbackData): Promise<FeedbackResponse> {
    const response = await api.post(`/api/feedback`, {
      tripId,
      ...feedbackData,
    });
    return response.data;
  },

  // Get user's feedback for a specific trip
  async getFeedbackForTrip(tripId: string): Promise<ExistingFeedback | null> {
    try {
      const response = await api.get(`/api/feedback/trip/${tripId}`);
      return response.data;
    } catch (error: any) {
      // Return null if feedback doesn't exist (404)
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get all user's feedback
  async getUserFeedback(): Promise<ExistingFeedback[]> {
    const response = await api.get(`/api/feedback/user`);
    return response.data;
  },

  // Update existing feedback
  async updateFeedback(feedbackId: string, feedbackData: Partial<FeedbackData>): Promise<FeedbackResponse> {
    const response = await api.put(`/api/feedback/${feedbackId}`, feedbackData);
    return response.data;
  },

  // Delete feedback
  async deleteFeedback(feedbackId: string): Promise<void> {
    await api.delete(`/api/feedback/${feedbackId}`);
  },

  // Check if user can leave feedback for a trip
  // (trip must be completed and user must have a paid booking)
  async canLeaveFeedback(tripId: string): Promise<{
    canReview: boolean;
    reason?: string;
    bookingStatus?: string;
    tripStatus?: string;
  }> {
    try {
      const response = await api.get(`/api/feedback/can-review/${tripId}`);
      return response.data;
    } catch (error: any) {
      return {
        canReview: false,
        reason: error.response?.data?.message || "Unable to check review eligibility",
      };
    }
  },
};