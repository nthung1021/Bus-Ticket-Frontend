import api from "@/lib/api";

export interface FeedbackData {
  bookingId: string; // C1 API Contract: Required field
  tripId: string;    // C1 API Contract: Required field
  rating: number;
  comment?: string;
}

// C1 API Contract: Simplified response format
export interface FeedbackResponse {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;  // ISO string format
  user: {
    name: string;
  };
}

export interface ExistingFeedback {
  id: string;
  rating: number;
  comment: string | null;
  submittedAt: string; // Keep for backwards compatibility
}

export interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string | null;
  submittedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface ReviewsListResponse {
  reviews: ReviewWithUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type SortBy = 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating';

export interface ReviewsListParams {
  page?: number;
  limit?: number;
  sortBy?: SortBy;
  tripId?: string;
  routeId?: string;
}

export const feedbackService = {
  // C1 API Contract: Submit new review for a booking
  async submitFeedback(bookingId: string, tripId: string, feedbackData: Omit<FeedbackData, 'bookingId' | 'tripId'>): Promise<FeedbackResponse> {
    const response = await api.post(`/reviews`, {
      bookingId,
      tripId,
      rating: feedbackData.rating,
      comment: feedbackData.comment || undefined,
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

  // Get reviews for a specific trip with pagination and sorting
  async getTripReviews(params: ReviewsListParams & { tripId: string }): Promise<ReviewsListResponse> {
    const { tripId, page = 1, limit = 10, sortBy = 'newest', ...otherParams } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      ...Object.entries(otherParams).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    });

    const response = await api.get(`/api/feedback/trip/${tripId}/reviews?${queryParams}`);
    return response.data;
  },

  // Get reviews for a specific route with pagination and sorting
  async getRouteReviews(params: ReviewsListParams & { routeId: string }): Promise<ReviewsListResponse> {
    const { routeId, page = 1, limit = 10, sortBy = 'newest', ...otherParams } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      ...Object.entries(otherParams).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    });

    const response = await api.get(`/api/feedback/route/${routeId}/reviews?${queryParams}`);
    return response.data;
  },

  // Get all reviews with pagination and sorting (public endpoint)
  async getAllReviews(params: ReviewsListParams = {}): Promise<ReviewsListResponse> {
    const { page = 1, limit = 10, sortBy = 'newest', ...otherParams } = params;
    
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      ...Object.entries(otherParams).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    });

    const response = await api.get(`/reviews?${queryParams}`);
    return response.data;
  },

  // Get review statistics for trip or route
  async getReviewStats(id: string, type: 'trip' | 'route'): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const response = await api.get(`/reviews/${type}/${id}/stats`);
    
    // Transform ratingDistribution from array to object format
    const rawData = response.data;
    const ratingDistribution: { [key: number]: number } = {};
    
    if (rawData.ratingDistribution && Array.isArray(rawData.ratingDistribution)) {
      rawData.ratingDistribution.forEach((item: { rating: number; count: number }) => {
        ratingDistribution[item.rating] = item.count;
      });
    }
    
    return {
      averageRating: rawData.averageRating || 0,
      totalReviews: rawData.totalReviews || 0,
      ratingDistribution,
    };
  },
};