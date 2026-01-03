"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewList } from "./review-list";
import { ReviewStats } from "./review-stats";
import { AuthenticatedReviewForm } from "./authenticated-review-form";
import { useCurrentUser } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  Star, 
  MessageSquare, 
  BarChart3,
  ArrowLeft,
  Plus
} from "lucide-react";

interface ReviewsPageProps {
  // Data source
  tripId?: string;
  routeId?: string;
  showAll?: boolean;
  
  // Trip/Route details for context
  contextData?: {
    title: string;
    subtitle?: string;
    description?: string;
  };
  
  // Navigation
  onBack?: () => void;
  showBackButton?: boolean;
  
  // Feature toggles
  allowNewReviews?: boolean;
  showStats?: boolean;
  showReviewForm?: boolean;
  
  // Layout options
  layout?: 'tabs' | 'stacked';
  className?: string;
}

export function ReviewsPage({
  tripId,
  routeId,
  showAll = false,
  contextData,
  onBack,
  showBackButton = false,
  allowNewReviews = true,
  showStats = true,
  showReviewForm = false,
  layout = 'tabs',
  className,
}: ReviewsPageProps) {
  const { data: user } = useCurrentUser();
  const [showNewReviewForm, setShowNewReviewForm] = React.useState(showReviewForm);

  const getPageTitle = () => {
    if (contextData?.title) return `Reviews - ${contextData.title}`;
    if (tripId) return "Trip Reviews";
    if (routeId) return "Route Reviews"; 
    return "All Reviews";
  };

  const getStatsId = () => tripId || routeId || '';
  const getStatsType = (): 'trip' | 'route' => tripId ? 'trip' : 'route';

  const handleNewReviewSuccess = () => {
    setShowNewReviewForm(false);
  };

  if (layout === 'stacked') {
    return (
      <div className={cn("container mx-auto py-6 max-w-6xl space-y-6", className)}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          {showBackButton && onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
            {contextData?.subtitle && (
              <p className="text-muted-foreground">{contextData.subtitle}</p>
            )}
          </div>
          
          {allowNewReviews && user && !showNewReviewForm && tripId && (
            <Button onClick={() => setShowNewReviewForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          )}
        </div>

        {/* Context Card */}
        {contextData?.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {contextData.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* New Review Form */}
        {showNewReviewForm && tripId && (
          <AuthenticatedReviewForm
            tripId={tripId}
            onSuccess={handleNewReviewSuccess}
            className="mb-6"
          />
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Statistics */}
          {showStats && (tripId || routeId) && (
            <div className="lg:col-span-1">
              <ReviewStats 
                id={getStatsId()}
                type={getStatsType()}
                title="Rating Overview"
                showDistribution
              />
            </div>
          )}
          
          {/* Reviews List */}
          <div className={cn(
            showStats && (tripId || routeId) ? "lg:col-span-3" : "lg:col-span-4"
          )}>
            <ReviewList
              tripId={tripId}
              routeId={routeId}
              showAll={showAll}
              title="Customer Reviews"
              showHeader
              showSortControls
              showPagination
              useInfiniteScroll={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Tabs Layout
  return (
    <div className={cn("container mx-auto py-6 max-w-6xl", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {showBackButton && onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
          {contextData?.subtitle && (
            <p className="text-muted-foreground">{contextData.subtitle}</p>
          )}
        </div>
        
        {allowNewReviews && user && !showNewReviewForm && tripId && (
          <Button onClick={() => setShowNewReviewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Write Review
          </Button>
        )}
      </div>

      {/* Context Card */}
      {contextData?.description && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {contextData.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Review Form */}
      {showNewReviewForm && tripId && (
        <AuthenticatedReviewForm
          tripId={tripId}
          onSuccess={handleNewReviewSuccess}
          className="mb-6"
        />
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="reviews" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          {showStats && (tripId || routeId) && (
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <ReviewList
            tripId={tripId}
            routeId={routeId}
            showAll={showAll}
            title="Customer Reviews"
            showHeader
            showSortControls
            showPagination
            useInfiniteScroll={false}
          />
        </TabsContent>

        {showStats && (tripId || routeId) && (
          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2 lg:col-span-2">
                <ReviewStats 
                  id={getStatsId()}
                  type={getStatsType()}
                  title="Rating Overview"
                  showDistribution
                />
              </div>
              
              {/* Additional stats cards can go here */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">4.5</div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">128</div>
                    <div className="text-xs text-muted-foreground">Total Reviews</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-xs text-muted-foreground">Satisfaction</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}