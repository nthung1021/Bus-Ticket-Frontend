import api from "@/lib/api";

/* ======================================================
   Types & Interfaces
====================================================== */

export interface FeedbackData {
  bookingId: string;
  tripId: string;
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface ExistingFeedback {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewWithUser {
  id: string;
  tripId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string;
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

export type SortBy =
  | "newest"
  | "oldest"
  | "highest_rating"
  | "lowest_rating";

export interface ReviewsListParams {
  page?: number;
  limit?: number;
  sortBy?: SortBy;
}

/* ======================================================
   Helpers
====================================================== */

function assertString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }
  return value;
}

/* ======================================================
   Service
====================================================== */

export const feedbackService = {
  /* =======================
     CREATE REVIEW
  ======================= */
  async submitFeedback(
    bookingId: string,
    tripId: string,
    feedbackData: Omit<FeedbackData, "bookingId" | "tripId">
  ): Promise<FeedbackResponse> {
    return (
      await api.post(`/reviews`, {
        bookingId: assertString(bookingId, "bookingId"),
        tripId: assertString(tripId, "tripId"),
        rating: feedbackData.rating,
        comment: feedbackData.comment || undefined,
      })
    ).data;
  },

  /* =======================
     GET FEEDBACK FOR TRIP
  ======================= */
  async getFeedbackForTrip(tripId: string): Promise<ReviewWithUser | null> {
    try {
      // Get user's review for this trip from my-reviews
      const response = await api.get('/reviews/my-reviews?limit=100');
      const userReviews = response.data.reviews;
      
      // Find the review for this specific trip
      const tripReview = userReviews.find((review: ReviewWithUser) => review.tripId === tripId);
      return tripReview || null;
    } catch (error: any) {
      // If error is 401 (not authenticated), return null
      if (error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },

  /* =======================
     CHECK CAN REVIEW
  ======================= */
  async canLeaveFeedback(bookingId: string): Promise<{
    canReview: boolean;
    reason?: string;
    bookingStatus?: string;
    tripStatus?: string;
  }> {
    try {
      const response = await api.get(
        `/reviews/can-review/${assertString(bookingId, "bookingId")}`
      );
      return response.data;
    } catch (error: any) {
      return {
        canReview: false,
        reason:
          error.response?.data?.message ||
          "Unable to check review eligibility",
      };
    }
  },

  /* =======================
     LIST REVIEWS
  ======================= */

  async getTripReviews(
    tripId: string,
    params: ReviewsListParams = {}
  ): Promise<ReviewsListResponse> {
    const safeTripId = assertString(tripId, "tripId");

    const queryParams = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      sortBy: params.sortBy ?? "newest",
    });

    const response = await api.get(
      `/reviews?tripId=${safeTripId}&${queryParams.toString()}`
    );
    return response.data;
  },

  async getUserReviews(
    userId: string,
    params: ReviewsListParams = {}
  ): Promise<ReviewsListResponse> {
    const safeUserId = assertString(userId, "userId");

    const queryParams = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      sortBy: params.sortBy ?? "newest",
    });

    const response = await api.get(
      `/reviews/user/${safeUserId}?${queryParams.toString()}`
    );
    return response.data;
  },

  async getMyReviews(
    params: ReviewsListParams = {}
  ): Promise<ReviewsListResponse> {
    const queryParams = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      sortBy: params.sortBy ?? "newest",
    });

    const response = await api.get(
      `/reviews/my-reviews?${queryParams.toString()}`
    );
    return response.data;
  },

  async getAllReviews(
    params: ReviewsListParams = {}
  ): Promise<ReviewsListResponse> {
    const queryParams = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      sortBy: params.sortBy ?? "newest",
    });

    const response = await api.get(`/reviews?${queryParams.toString()}`);
    return response.data;
  },

  /* =======================
     REVIEW DETAIL
  ======================= */

  async getReviewById(reviewId: string): Promise<ReviewWithUser> {
    return (
      await api.get(`/reviews/${assertString(reviewId, "reviewId")}`)
    ).data;
  },

  async updateReview(
    reviewId: string,
    data: Partial<FeedbackData>
  ): Promise<FeedbackResponse> {
    return (
      await api.patch(
        `/reviews/${assertString(reviewId, "reviewId")}`,
        data
      )
    ).data;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await api.delete(`/reviews/${assertString(reviewId, "reviewId")}`);
  },

  /* =======================
     REVIEW STATS
     Backend:
     GET /reviews/stats
     GET /reviews/stats?tripId=UUID
  ======================= */

  async getReviewStats(tripId?: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const endpoint = tripId
      ? `/reviews/stats?tripId=${assertString(tripId, "tripId")}`
      : `/reviews/stats`;

    const response = await api.get(endpoint);
    const rawData = response.data;

    return {
      averageRating: rawData.averageRating ?? 0,
      totalReviews: rawData.totalReviews ?? 0,
      ratingDistribution: rawData.ratingDistribution || {},
    };
  },
};
