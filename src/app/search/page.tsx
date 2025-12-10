"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import api from "@/lib/api";
import { Route } from "@/services/route.service";
import { routeService } from "@/services/route.service";
import { formatCurrency, getCurrencySymbol } from "@/utils/formatCurrency";

// Search filters interface
interface SearchFilters {
  query: string;
  tripType: string[];
  minPrice: number;
  maxPrice: number;
  location: string;
  category: string[];
  sortBy: string;
}

// Search result data based on Route
interface SearchResult {
  id: string;
  title: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  price: number;
  duration: string;
  distance: number;
  image: string;
  description: string;
  category: string;
  rating: number;
}

const categories = ["Premium", "Standard", "Tourist", "Cultural"];
const tripTypes = ["One-way", "Round-trip"];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

// Convert Route to SearchResult
const convertRouteToSearchResult = (route: Route): SearchResult => ({
  id: route.id,
  title: route.name || `${route.origin} → ${route.destination}`,
  origin: route.origin || 'Unknown',
  destination: route.destination || 'Unknown',
  departure: route.origin || 'Unknown',
  arrival: route.destination || 'Unknown',
  price: Math.floor((route.distanceKm || 100) * 1000), // Estimate price based on distance
  duration: String(route.estimatedMinutes || 180),
  distance: route.distanceKm || 100,
  image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
  description: route.description || `Route from ${route.origin} to ${route.destination}`,
  category: route.distanceKm && route.distanceKm > 300 ? "Premium" : "Standard",
  rating: 4.5 + Math.random() * 0.5 // Random rating between 4.5-5.0
});

function SearchPageContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    tripType: [],
    minPrice: 0,
    maxPrice: 500000,
    location: "",
    category: [],
    sortBy: "newest",
  });

  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 6;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const date = searchParams.get("date") || "";
  // console.log(date);
  const passengers = searchParams.get("passengers") || "";

  useEffect(() => {
    if (!origin || !destination || !date) {
      console.log('🔍 Missing search parameters:', { origin, destination, date });
      return;
    }

    console.log('🚌 Searching trips with params:', { origin, destination, date });
    setIsLoading(true);
    setError(null);

    // Convert date to ISO 8601 format (YYYY-MM-DD)
    const formattedDate = date ? new Date(`${date}T00:00:00`).toISOString() : '';
    console.log(formattedDate)
    api.get("/trips/search", {
      params: {
        origin,
        destination,
        date: formattedDate,
      },
    })
      .then((response) => {
        const data = response.data?.data ?? [];
        console.log('✅ Search API response:', response.data);
        console.log('📊 Found trips:', data.length);

        const mapped: SearchResult[] = data.map((trip: any) => {
          const departureCity = trip.route?.origin ?? origin;
          const arrivalCity = trip.route?.destination ?? destination;

          const departureTime = trip.schedule?.departureTime
            ? new Date(trip.schedule.departureTime)
            : null;
          const arrivalTime = trip.schedule?.arrivalTime
            ? new Date(trip.schedule.arrivalTime)
            : null;

          let durationLabel = "";
          if (trip.schedule?.duration != null) {
            const hours = Math.floor(trip.schedule.duration / 60);
            const minutes = trip.schedule.duration % 60;
            durationLabel = `${hours}h${minutes ? ` ${minutes}m` : ""}`;
          }

          return {
            id: trip.tripId,
            title:
              trip.operator?.name && departureCity && arrivalCity
                ? `${trip.operator.name} ${departureCity} - ${arrivalCity}`
                : `${departureCity} - ${arrivalCity}`,
            origin: departureCity || "",
            destination: arrivalCity || "",
            location:
              departureCity && arrivalCity
                ? `${departureCity} → ${arrivalCity}`
                : "",
            departure: departureCity || "",
            arrival: arrivalCity || "",
            // Ensure price is numeric so filters and sorting work correctly
            price: trip.pricing?.basePrice != null
              ? Number(trip.pricing.basePrice)
              : 0,
            duration: durationLabel,
            distance:
              trip.route?.distanceKm != null
                ? Number(trip.route.distanceKm)
                : 0,
            image:
              "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
            description:
              trip.bus?.model && trip.bus?.amenities?.length
                ? `${trip.bus.model} • ${trip.bus.amenities.join(", ")}`
                : trip.bus?.model || "",
            category: trip.bus?.busType || "Standard",
            rating: trip.operator?.rating ?? 0.0,
          };
        });

        // Store all results; filters will be applied in the next effect.
        // Do NOT auto-populate filters.location from origin/destination,
        // because the location filter expects single-city matches and would
        // otherwise immediately filter out all results.
        setAllResults(mapped);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
          "Failed to load trips. Please try again.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [origin, destination, date]);

  // Filter and sort results
  useEffect(() => {
    let filteredResults = [...allResults];

    // Apply filters
    if (filters.query) {
      filteredResults = filteredResults.filter((result) =>
        result.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        result.description.toLowerCase().includes(filters.query.toLowerCase()) ||
        result.origin.toLowerCase().includes(filters.query.toLowerCase()) ||
        result.destination.toLowerCase().includes(filters.query.toLowerCase())
      );
    }

    if (filters.category.length > 0) {
      filteredResults = filteredResults.filter((result) =>
        filters.category.includes(result.category)
      );
    }

    filteredResults = filteredResults.filter((result) =>
      result.price >= filters.minPrice && result.price <= filters.maxPrice
    );

    if (filters.location) {
      filteredResults = filteredResults.filter((result) =>
        result.departure.toLowerCase().includes(filters.location.toLowerCase()) ||
        result.arrival.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "price-asc":
        filteredResults.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredResults.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filteredResults.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
      default:
        // Keep original order for newest
        break;
    }

    setResults(filteredResults);
    setCurrentPage(1);
  }, [filters, allResults]);

  const handleSearch = () => {
    // Search is handled by useEffect when filters.query changes
    console.log("Search triggered with query:", filters.query);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter((c) => c !== category)
        : [...prev.category, category],
    }));
  };

  const handleTripTypeToggle = (tripType: string) => {
    setFilters((prev) => ({
      ...prev,
      tripType: prev.tripType.includes(tripType)
        ? prev.tripType.filter((t) => t !== tripType)
        : [...prev.tripType, tripType],
    }));
  };

  // Pagination
  const totalPages = Math.ceil(results.length / resultsPerPage);

  const startIndex = (currentPage - 1) * resultsPerPage;
  const currentResults = results.slice(startIndex, startIndex + resultsPerPage);

  return (
    <div className="min-h-screen bg-background">
      {/* Search Bar */}
      <section className="bg-card/95 dark:bg-black/90 backdrop-blur-sm border-b border-border/70 dark:border-border/50">
        <div className="container mx-auto px-6 lg:px-8 xl:px-12 py-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search destinations, routes, or cities..."
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                className="h-12 text-body bg-background/90 dark:bg-black/95 border-border/70 dark:border-border/50 focus:border-primary dark:focus:border-primary transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer px-6 h-12"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden border-border hover:bg-accent cursor-pointer px-4 h-12"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              Filters
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-8 xl:px-12 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <aside
            className={`lg:block ${isFilterOpen ? "block" : "hidden"} space-y-6`}
          >
            <Card
              className="bg-card/90 dark:bg-black/95 backdrop-blur-sm border border-border/70 dark:border-border/40 rounded-xl p-6 shadow-lg dark:shadow-2xl"
            >
              <h3 className="text-h5 font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                Filters
              </h3>

              {/* Trip Type */}
              <div className="space-y-3">
                <h4 className="text-h6 font-semibold text-foreground flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Trip Type
                </h4>
                <div className="space-y-2 bg-muted/30 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30">
                  {tripTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-3 py-1.5 px-2 rounded-md hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors">
                      <Checkbox
                        id={type}
                        checked={filters.tripType.includes(type)}
                        onCheckedChange={() => handleTripTypeToggle(type)}
                        className="cursor-pointer bg-secondary data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 border-2"
                      />
                      <label
                        htmlFor={type}
                        className="text-sm text-foreground cursor-pointer font-medium flex-1"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <h4 className="text-h6 font-semibold text-foreground flex items-center gap-1">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  Price Range ({getCurrencySymbol()})
                </h4>
                <div className="bg-muted/30 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="text-xs font-medium text-foreground mb-1.5 block"
                      >
                        Min Price
                      </label>
                      <Input
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", parseInt(e.target.value) || 0)
                        }
                        className="h-9 bg-background/90 dark:bg-black/95 border-border/60 dark:border-border/40 focus:border-primary text-sm transition-colors"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs font-medium text-foreground mb-1.5 block"
                      >
                        Max Price
                      </label>
                      <Input
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", parseInt(e.target.value) || 500000)
                        }
                        className="h-9 bg-background/90 dark:bg-black/95 border-border/60 dark:border-border/40 focus:border-primary text-sm transition-colors"
                        placeholder="500,000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-3">
                <h4 className="text-h6 font-semibold text-foreground flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Location
                </h4>
                <div className="bg-muted/30 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30">
                  <Input
                    placeholder="Enter departure or destination..."
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="h-9 bg-background/90 dark:bg-black/95 border-border/60 dark:border-border/40 focus:border-primary text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <h4 className="text-h6 font-semibold text-foreground flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Category
                </h4>
                <div className="space-y-2 bg-muted/30 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30">
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center space-x-3 py-1.5 px-2 rounded-md hover:bg-muted/50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <Checkbox
                        id={category}
                        checked={filters.category.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                        className="cursor-pointer bg-secondary data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 border-2"
                      />
                      <label
                        htmlFor={category}
                        className="text-sm text-foreground cursor-pointer font-medium flex-1"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      query: "",
                      tripType: [],
                      minPrice: 0,
                      maxPrice: 500000,
                      location: "",
                      category: [],
                      sortBy: "price-asc",
                    });
                  }}
                  className="w-full h-9 border-border hover:bg-muted hover:text-muted-foreground transition-colors cursor-pointer text-sm"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear All Filters
                </Button>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Sort Controls & Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-body text-muted-foreground">
                {origin && destination && date ? (
                  <>
                    Found {results.length} routes for{" "}
                    <span className="font-semibold text-foreground">
                      {origin} → {destination}
                    </span>{" "}
                    on{" "}
                    <span className="font-semibold text-foreground">
                      {date}
                    </span>
                    {passengers && (
                      <span>
                        {" "}
                        for {passengers} passenger
                        {Number(passengers) > 1 ? "s" : ""}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Found {results.length} routes
                    {filters.query && (
                      <span> for "{filters.query}"</span>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-body text-foreground">Sort by:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="bg-background/90 dark:bg-black/95 border border-border/70 dark:border-border/50 rounded-lg px-3 py-2 text-body cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && !isLoading && (
              <Card
                className="bg-destructive/10 border border-destructive/40 rounded-xl p-6 mb-4"
              >
                <p className="text-body text-destructive">{error}</p>
              </Card>
            )}

            {!isLoading && currentResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentResults.map((result) => (
                    <Card
                      key={result.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-4 right-4">
                          <span className="bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-caption font-medium backdrop-blur-sm">
                            {result.category}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 text-white">
                          <div className="flex items-center gap-2 mb-1">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-caption font-medium">
                              {result.rating}
                            </span>
                          </div>
                          <p className="text-caption bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                            {result.distance} km • {result.duration}
                          </p>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <h3 className="text-h5 font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {result.title}
                            </h3>
                            <p className="text-body text-muted-foreground flex items-center gap-2">
                              <svg
                                className="w-4 h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                              </svg>
                              {result.origin} → {result.destination}
                            </p>
                            <p className="text-body text-muted-foreground line-clamp-2">
                              {result.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-h5 font-bold text-primary">
                              {formatCurrency(result.price)}
                            </span>
                            <Link href={`/trips/${result.id}`}>
                              <Button size="sm" className="group-hover:bg-primary/90 cursor-pointer">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-8">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className="w-10 h-10 cursor-pointer"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className="cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Button>
                  </div>
                )}
              </>
            ) : !isLoading ? (
              /* No Results */
              <Card
                className="bg-card border border-border rounded-xl p-12 text-center"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-h4 font-semibold text-foreground">
                    No routes found
                  </h3>
                  <p className="text-body text-muted-foreground max-w-md mx-auto">
                    Try adjusting your filters or search terms to find more results.
                  </p>
                  <Button
                    onClick={() => setFilters({
                      query: "",
                      tripType: [],
                      minPrice: 0,
                      maxPrice: 500000,
                      location: "",
                      category: [],
                      sortBy: "newest"
                    })}
                    variant="outline"
                    className="cursor-pointer"
                  >
                    Clear Filters
                  </Button>
                </div>
              </Card>
            ) : (
              /* Loading */
              <Card
                className="bg-card border border-border rounded-xl p-12 text-center"
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-h4 font-semibold text-foreground">
                    Loading routes...
                  </h3>
                  <p className="text-body text-muted-foreground max-w-md mx-auto">
                    Please wait while we find suitable trip for you.
                  </p>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading search results...
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}