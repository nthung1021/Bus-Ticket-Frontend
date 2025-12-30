"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import api from "@/lib/api";
//import SeatSelectionDialog from "@/components/seat/SeatSelectionDialog";
import SeatSelectionMap from "@/components/seat-selection/SeatSelectionMap";
import { seatLayoutService, SeatLayout, SeatInfo } from "@/services/seat-layout.service";
import toast from "react-hot-toast";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/utils/formatCurrency";
import { ReviewList, ReviewStats } from "@/components/feedback";
import { feedbackService } from "@/services/feedback.service";
import { Star, MessageSquare } from "lucide-react";

interface TripParams {
  id: string;
}

interface Trip {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description: string;
  features: string[];
  duration: string;
  departure: string;
  arrival: string;
  busType: string;
  amenities: string[];
  departureTime: string;
  arrivalTime: string;
}

// Optional mock data map kept for the "Related Routes" section.
// It is empty by default; you can populate it with curated routes if desired.
const mockTrips: Record<string, Trip> = {};

export default function TripDetailPage({ params }: { params: Promise<TripParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showSeatSelection, setShowSeatSelection] = useState(false);

  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null);
  const [loadingSeatLayout, setLoadingSeatLayout] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<SeatInfo[]>([]);
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [busId, setBusId] = useState<string | null>(null);
  const [relatedTrips, setRelatedTrips] = useState<Trip[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  // Image gallery state
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  // Review state
  const [reviewStats, setReviewStats] = useState<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  } | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const handleSeatSelection = (selectedSeats: SeatInfo[]) => {
    // Map seats to include price so downstream pages don't break when formatting
    const mappedSeats = selectedSeats.map((seat) => ({
      id: seat.id,
      code: seat.code,
      type: seat.type,
      // Prefer explicit seat price if present, otherwise fall back to seat type pricing from layout
      price:
        seat.price ??
        (seatLayout?.seatPricing?.seatTypePrices[seat.type] ?? 0),
    }));

    const seatsParam = encodeURIComponent(JSON.stringify(mappedSeats));
    router.push(`/passenger-info?tripId=${resolvedParams.id}&seats=${seatsParam}`);
  };

  const handleSeatSelectionChange = (seats: SeatInfo[]) => {
    setSelectedSeats(seats);
    // setSelectedQuantity(seats.length);
  };

  const handleBookNow = () => {
    if (seatLayout) {
      setSeatDialogOpen(true);
    } else if (busId) {
      fetchSeatLayout();
    } else {
      // Try to proceed without seat selection for now
      toast.success('Proceeding to passenger information...');
      router.push(`/passenger-info?tripId=${resolvedParams.id}`);
    }
  };

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/trips/${resolvedParams.id}`);

        const trip = response.data?.data;

        if (!trip) {
          setTrip(null);
          return;
        }

        const departureCity = trip.route?.origin ?? "";
        const arrivalCity = trip.route?.destination ?? "";

        // Calculate duration from departure and arrival times if available
        let durationLabel = "";
        if (trip.schedule?.departureTime && trip.schedule?.arrivalTime) {
          const departure = new Date(trip.schedule.departureTime);
          const arrival = new Date(trip.schedule.arrivalTime);
          const durationMs = arrival.getTime() - departure.getTime();
          
          if (durationMs > 0) {
            const durationMinutes = Math.floor(durationMs / (1000 * 60));
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            durationLabel = `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
          }
        } else if (trip.schedule?.duration != null) {
          // Fallback to provided duration if it's a positive number
          const durationMinutes = Number(trip.schedule.duration);
          if (durationMinutes > 0) {
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            durationLabel = `${hours}h${minutes > 0 ? ` ${minutes}m` : ""}`;
          }
        }

        const price =
          trip.pricing?.basePrice != null
            ? Number(trip.pricing.basePrice)
            : 0;

        const descriptionParts: string[] = [];
        if (trip.bus?.model) {
          descriptionParts.push(trip.bus.model);
        }
        if (trip.bus?.amenities?.length) {
          descriptionParts.push(trip.bus.amenities.join(", "));
        }

        const mappedTrip: Trip = {
          id: trip.tripId,
          name:
            trip.operator?.name && departureCity && arrivalCity
              ? `${trip.operator.name} ${departureCity} - ${arrivalCity}`
              : `${departureCity} - ${arrivalCity}`,
          category: "Bus Route",
          price,
          originalPrice: undefined,
          image:
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
          images: (trip.media && Array.isArray(trip.media.images) && trip.media.images.filter((u:any)=>typeof u === 'string' && u.length > 0).length > 0)
            ? trip.media.images.filter((u:any)=>typeof u === 'string' && u.length > 0)
            : [
                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
                "https://www.travelalaska.com/sites/default/files/2022-02/GettingAround_Motorcoach_Hero_%28Design%20Pics%20Inc%2C%20Alamy%20Stock%20Photo%29%20crop.jpg",
                "https://images.unsplash.com/photo-1694671295667-6fe824195756?fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
              ],
          description:
            descriptionParts.length > 0
              ? descriptionParts.join(" • ")
              : "Comfortable bus route with modern amenities.",
          features: [
            "Comfortable seating",
            "Air conditioning",
            "Safe and reliable service",
            "Professional driver",
          ],
          duration: durationLabel,
          departure: departureCity,
          arrival: arrivalCity,
          busType: trip.bus?.model || "Standard bus",
          amenities: Array.isArray(trip.bus?.amenities) 
            ? trip.bus.amenities 
            : typeof trip.bus?.amenities === 'string' 
              ? trip.bus.amenities.split(',').map((a: string) => a.trim()).filter((a: string) => a.length > 0)
              : [],
          departureTime: trip.schedule?.departureTime
            ? new Date(trip.schedule.departureTime).toLocaleString()
            : "",
          arrivalTime: trip.schedule?.arrivalTime
            ? new Date(trip.schedule.arrivalTime).toLocaleString()
            : "",
        };

        setTrip(mappedTrip);
        // initialize gallery
        setImages(mappedTrip.images || [mappedTrip.image]);
        setCurrentImageIndex(0);
        // Store bus ID for seat layout fetching
        if (trip.bus?.busId) {
          setBusId(trip.bus.busId);
        }
      } catch (error) {
        console.error("Failed to load trip details", error);
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [resolvedParams.id]);

  // Fetch related trips based on same route (origin/destination)
  // Fetch review statistics
  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!resolvedParams.id) return;
      
      try {
        setLoadingReviews(true);
        const stats = await feedbackService.getReviewStats(resolvedParams.id);
        setReviewStats(stats);
      } catch (error) {
        console.error('Failed to load review stats:', error);
        setReviewStats(null);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviewStats();
  }, [resolvedParams.id]);

  useEffect(() => {
    const fetchRelatedTrips = async () => {
      if (!trip?.departure || !trip?.arrival) return;
      
      try {
        setLoadingRelated(true);
        const response = await api.get("/trips/search", {
          params: {
            origin: trip.departure,
            destination: trip.arrival,
          },
        });

        const trips = response.data?.data || [];
        const relevantTrips = trips
          .filter((t: any) => t.tripId !== trip.id) // Exclude current trip
          .slice(0, 3) // Limit to 3 related trips
          .map((t: any) => ({
            id: t.tripId,
            name: `${t.operator?.name || "Bus"} ${t.route?.origin} - ${t.route?.destination}`,
            category: "Bus Route",
            price: t.pricing?.basePrice || 0,
            image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
            departure: t.route?.origin || "",
            arrival: t.route?.destination || "",
            duration: t.schedule?.duration ? `${Math.floor(t.schedule.duration / 60)}h${t.schedule.duration % 60 ? ` ${t.schedule.duration % 60}m` : ""}` : "N/A",
          }));

        setRelatedTrips(relevantTrips);
      } catch (error) {
        console.error("Failed to load related trips", error);
        setRelatedTrips([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    if (trip) {
      fetchRelatedTrips();
    }
  }, [trip]);

  const fetchSeatLayout = async () => {
    if (!busId) {
      console.error('❌ fetchSeatLayout: No busId available');
      toast.error("Bus information not available");
      return;
    }

    try {
      setLoadingSeatLayout(true);
      const layout = await seatLayoutService.getByBusId(busId, resolvedParams.id);
      setSeatLayout(layout);
      setSeatDialogOpen(true);
    } catch (error) {
      console.error("Failed to load seat layout", error);
      toast.error("Seat layout not available for this bus. Proceeding to passenger info...");
      // Fallback: proceed to passenger info without seat selection
      router.push(`/passenger-info?tripId=${resolvedParams.id}`);
    } finally {
      setLoadingSeatLayout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-6 lg:px-8 xl:px-12 space-y-12 max-w-7xl">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="aspect-4/3 bg-muted rounded-xl animate-pulse"></div>
            </div>
            <div className="space-y-6">
              <div className="h-12 bg-muted rounded-lg animate-pulse"></div>
              <div className="h-6 bg-muted rounded w-2/3 animate-pulse"></div>
              <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
              <div className="h-32 bg-muted rounded-lg animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-12 bg-muted rounded-lg w-40 animate-pulse"></div>
                <div className="h-12 bg-muted rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto py-12 px-6 lg:px-8 xl:px-12 max-w-4xl">
          <Card className="bg-card border border-border rounded-2xl p-12 text-center max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-h2 mb-4">Route Not Found</h1>
              <p className="text-body text-muted-foreground mb-8 max-w-md mx-auto">
                The bus route you're looking for doesn't exist or has been removed. Please try again or explore our popular routes.
              </p>
              <Link href="/">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer px-8 py-3">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-6 lg:px-8 xl:px-12 space-y-12 max-w-7xl">
        {/* Main Trip Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Trip Image */}
          <div className="bg-card border border-border rounded-2xl p-6 h-fit">
            <div className="space-y-4">
              <div className="group cursor-pointer">
                    <img
                      src={images[currentImageIndex] || trip.image}
                      alt={trip.name}
                      onClick={() => setImageDialogOpen(true)}
                      className="w-full aspect-4/3 rounded-xl object-cover cursor-pointer group-hover:scale-[1.02] transition-transform duration-300"
                    />
              </div>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, idx) => (
                        <div
                          key={idx}
                          className={`aspect-video rounded-lg overflow-hidden cursor-pointer border ${idx === currentImageIndex ? 'ring-2 ring-primary border-primary' : 'bg-muted border-border'}`}
                          onClick={() => { setCurrentImageIndex(idx); }}
                        >
                          <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      ))}
                  </div>
            </div>
          </div>

          {/* Trip Info */}
          <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col">
            {/* Header Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="inline-block mb-3">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-caption font-medium">
                      {trip.category}
                    </span>
                  </div>
                  <h1 className="text-h2 text-foreground leading-tight">{trip.name}</h1>
                </div>
                
                {/* Quick Rating Display */}
                {reviewStats && reviewStats.totalReviews > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-h5 font-bold text-foreground">
                          {reviewStats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="text-caption text-muted-foreground">
                      {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price & Rating */}
            <div className="bg-linear-to-br from-muted/30 to-muted/10 border border-border rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-h4 text-primary font-bold">
                  {formatCurrency(trip.price)}
                </span>
                {trip.originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-body text-muted-foreground line-through">
                      {formatCurrency(trip.originalPrice)}
                    </span>
                    <span className="bg-accent text-white px-2 py-1 rounded text-caption font-medium">
                      Save {Math.round(((trip.originalPrice - trip.price) / trip.originalPrice) * 100)}%
                    </span>
                  </div>
                )}
              </div>
              
              {/* Rating Summary */}
              {reviewStats && reviewStats.totalReviews > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-body font-semibold text-foreground">
                      {reviewStats.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span className="text-caption">
                      {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
              
              {loadingReviews && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-caption">Loading reviews...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Route Details */}
            <div className="bg-linear-to-br from-primary/5 to-primary/2 border border-primary/20 rounded-xl p-4 mb-6 flex-1">
              <h3 className="text-h6 text-foreground font-semibold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Route Information
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-caption text-muted-foreground mb-1 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    Departure
                  </h4>
                  <p className="text-body font-medium">{trip.departure}</p>
                  <p className="text-caption text-muted-foreground">{trip.departureTime}</p>
                </div>
                <div>
                  <h4 className="text-caption text-muted-foreground mb-1 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    Arrival
                  </h4>
                  <p className="text-body font-medium">{trip.arrival}</p>
                  <p className="text-caption text-muted-foreground">{trip.arrivalTime}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-caption text-muted-foreground mb-1">Duration</h4>
                  <p className="text-body font-medium">{trip.duration}</p>
                </div>
                <div>
                  <h4 className="text-caption text-muted-foreground mb-1">Bus Type</h4>
                  <p className="text-caption font-medium">{trip.busType}</p>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 mb-4">
              <label className="text-caption text-muted-foreground font-medium mb-3 flex items-center gap-2">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Tickets
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors p-0"
                    disabled={selectedQuantity <= 1}
                  >
                    -
                  </Button>
                  <span className="text-body font-semibold w-8 text-center">{selectedQuantity}</span>
                  <Button
                    onClick={() => setSelectedQuantity(Math.min(10, selectedQuantity + 1))}
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors p-0"
                    disabled={selectedQuantity >= 10}
                  >
                    +
                  </Button>
                </div>
                <div className="text-right">
                  <p className="text-caption text-muted-foreground">Total</p>
                  <p className="text-body font-bold text-primary">
                    {formatCurrency(
                      (trip.price + selectedSeats.reduce((total, seat) => 
                        total + (seat.price || (seatLayout?.seatPricing?.seatTypePrices[seat.type] ?? 0)), 0)))}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
              <Button 
                onClick={handleBookNow}
                className="bg-primary text-primary-foreground rounded-xl px-4 py-3 hover:bg-primary/90 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13h10M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
                <span className="font-semibold">Book Now</span>
              </Button>
              <Button variant="outline" className="border border-border text-foreground rounded-xl px-4 py-3 hover:bg-accent transition-all duration-200 cursor-pointer group">
                <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-semibold">Save</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Image Lightbox (custom overlay to avoid Dialog outside-click handling) */}
        {imageDialogOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-20"
            onClick={() => setImageDialogOpen(false)}
          >
            <div
              className="relative max-w-[80vw] max-h-[calc(100vh-6rem)] w-auto h-auto flex items-center justify-center px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 text-white p-2 rounded-full"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

                <div className="max-w-full max-h-full flex items-center justify-center p-0">
                <img
                  src={images[currentImageIndex]}
                  alt={`full-${currentImageIndex}`}
                  className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg"
                />
              </div>

              <button
                onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-50 bg-black/40 text-white p-2 rounded-full"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <h2 className="text-h3 text-foreground flex items-center gap-3">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            Route Description
          </h2>
          <p className="text-body leading-relaxed text-foreground text-lg">
            {trip.description}
          </p>
        </section>

        {/* Features & Amenities */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <h2 className="text-h3 text-foreground flex items-center gap-3">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              Features
            </h2>
            <ul className="space-y-4">
              {trip.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-4 group cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-body text-foreground leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-card border border-border rounded-2xl p-8 space-y-6">
            <h2 className="text-h3 text-foreground flex items-center gap-3">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(trip.amenities) && trip.amenities.length > 0 ? (
                trip.amenities.map((amenity, index) => (
                  <div key={index} className="bg-linear-to-br from-muted/30 to-muted/10 border border-border rounded-xl p-4 text-center group hover:from-primary/5 hover:to-primary/10 hover:border-primary/20 transition-all duration-200 cursor-pointer">
                    <div className="w-8 h-8 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-body text-foreground font-medium">{amenity}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No amenities listed for this trip.</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Customer Reviews Section */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-h3 text-foreground flex items-center justify-center gap-3">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              Customer Reviews
              <div className="w-2 h-8 bg-primary rounded-full"></div>
            </h2>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              See what other passengers are saying about this route
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Review Statistics */}
            <div className="lg:col-span-1">
              <ReviewStats 
                tripId={resolvedParams.id}
                // type="trip"
                title="Rating Overview"
                showDistribution
                className="sticky top-4"
              />
            </div>
            
            {/* Review List */}
            <div className="lg:col-span-3">
              <ReviewList
                tripId={resolvedParams.id}
                title="Recent Reviews"
                showHeader
                showSortControls
                showPagination
                useInfiniteScroll={false}
                initialLimit={5}
              />
            </div>
          </div>
        </section>

        {/* Related Routes */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-h3 text-foreground flex items-center justify-center gap-3">
              <div className="w-2 h-8 bg-primary rounded-full"></div>
              Relevant Routes
              <div className="w-2 h-8 bg-primary rounded-full"></div>
            </h2>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              Other trips on the same route with similar schedules
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingRelated ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-card rounded-2xl p-6 animate-pulse">
                  <div className="aspect-4/3 bg-muted rounded-xl mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4 w-2/3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : relatedTrips.length > 0 ? (
              relatedTrips.map((relatedTrip) => (
                <Link key={relatedTrip.id} href={`/trips/${relatedTrip.id}`} className="group cursor-pointer">
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] h-full">
                    <div className="aspect-4/3 bg-muted relative overflow-hidden">
                      <img
                        src={relatedTrip.image}
                        alt={relatedTrip.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <p className="text-caption font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                          {relatedTrip.duration}
                        </p>
                      </div>
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-h5 font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {relatedTrip.name}
                        </h3>
                        <p className="text-caption text-muted-foreground flex items-center gap-2">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {relatedTrip.departure} → {relatedTrip.arrival}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-h6 font-bold text-primary">
                          {formatCurrency(relatedTrip.price)}
                        </span>
                        <Button size="sm" className="group-hover:bg-primary/90 text-caption cursor-pointer px-4 py-2">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No similar routes available at this time.</p>
              </div>
            )}
          </div>
        </section>

        {/* Seat Selection Dialog */}
        <Dialog open={seatDialogOpen} onOpenChange={(open) => {
          setSeatDialogOpen(open);
          // When dialog closes, unlock all seats will be handled by SeatSelectionMap's cleanup
        }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-h4 font-bold">
                Select Your Seats
              </DialogTitle>
            </DialogHeader>

            {seatLayout && (
              <SeatSelectionMap
                layoutConfig={seatLayout.layoutConfig}
                seatPricing={seatLayout.seatPricing}
                onSelectionChange={handleSeatSelectionChange}
                maxSeats={selectedQuantity}
                tripId={trip.id}
              />
            )}

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setSeatDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement booking logic with selected seats
                  toast.success(`Booking ${selectedSeats.length} seat(s)`);
                  setSeatDialogOpen(false);
                  handleSeatSelection(selectedSeats);
                }}
                disabled={selectedSeats.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue to Booking ({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''})
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seat Selection Dialog */}
      {/*
      <SeatSelectionDialog
        open={showSeatSelection}
        onOpenChange={setShowSeatSelection}
        tripId={resolvedParams.id}
        maxSeats={selectedQuantity}
        onConfirm={handleSeatSelection}
      />
      */}
    </div>
  );
}