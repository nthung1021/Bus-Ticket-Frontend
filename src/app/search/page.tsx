"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import api from "@/lib/api";
import { formatCurrency, getCurrencySymbol } from "@/utils/formatCurrency";
import { filterWithVietnameseSearch, matchesWithoutDiacritics } from "@/utils/vietnameseSearch";

// Search filters interface
interface SearchFilters {
  query: string;
  category: string[]; // Bus types: standard, vip, sleeper, etc.
  minPrice: number;
  maxPrice: number;
  from: string;
  to: string;
  operator: string;
  departureTime: string; // morning|afternoon|evening|night
  date: string; // yyyy-mm-dd
  sortBy: string;
}

// Search result data for trips
interface SearchResult {
  id: string;
  title: string;
  origin: string;
  destination: string;
  location?: string;
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

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "departure-asc", label: "Departure: Earliest First" },
  { value: "departure-desc", label: "Departure: Latest First" },
];

// Helper function to format bus type labels
const formatBusTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'standard': 'Standard',
    'vip': 'VIP',
    'sleeper': 'Sleeper',
    'limousine': 'Limousine',
    'business': 'Business',
    'seater': 'Seater',
  };
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
};


function SearchPageContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: [],
    minPrice: 0,
    maxPrice: 500000,
    from: "",
    to: "",
    operator: "",
    departureTime: "",
    date: "",
    sortBy: "newest",
  });

  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
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

  // Effective display values for date and time (prefer filter values)
  const effectiveDateDisplay = filters.date || date;
  const timeLabelMap: Record<string, string> = {
    morning: "Morning (05:00-11:59)",
    afternoon: "Afternoon (12:00-16:59)",
    evening: "Evening (17:00-20:59)",
    night: "Night (21:00-04:59)",
  };
  const effectiveTimeLabel = filters.departureTime
    ? timeLabelMap[filters.departureTime] || filters.departureTime
    : "Any time";

  // Load bus types and operators from API
  useEffect(() => {
    // Fetch buses to get unique bus types
    api.get("/buses")
      .then((response) => {
        const buses = response.data || [];
        const uniqueBusTypes = Array.from(
          new Set(buses.map((bus: any) => bus.busType).filter((type: any) => !!type))
        ).sort();
        setCategories(uniqueBusTypes as string[]);
        console.log('✅ Loaded bus types:', uniqueBusTypes);
      })
      .catch((err) => {
        console.error('❌ Failed to load bus types:', err);
      });

    // Fetch operators
    api.get("/operators")
      .then((response) => {
        const ops = response.data || [];
        const operatorNames = ops
          .filter((op: any) => op.status === 'approved')
          .map((op: any) => op.name)
          .sort();
        setOperators(operatorNames);
        console.log('✅ Loaded operators:', operatorNames);
      })
      .catch((err) => {
        console.error('❌ Failed to load operators:', err);
      });
  }, []);

  useEffect(() => {
    // Require at least origin and destination for trip searches
    if (!origin || !destination) {
      console.log('❌ Missing required search parameters (origin/destination).');
      setAllResults([]);
      setIsLoading(false);
      setError("Please provide origin and destination to search for trips.");
      return;
    }

    console.log('🚌 Searching trips with params:', { origin, destination, date: date || 'any date' });
    setIsLoading(true);
    setError(null);

    // Convert date to ISO 8601 format (YYYY-MM-DD) if provided.
    const searchParams: any = {
      origin,
      destination,
    };

    // prefer filter date (if set) over URL param
    const effectiveDate = filters.date || date;
    if (effectiveDate) {
      // Just send the date in YYYY-MM-DD format, backend will handle timezone
      searchParams.date = effectiveDate;
      console.log('📅 Using specific date:', effectiveDate);
    } else {
      console.log('📅 Searching all dates');
    }

    // Include departure time bucket if selected (morning/afternoon/evening/night)
    if (filters.departureTime) {
      searchParams.departureTime = filters.departureTime;
      console.log('⏱️ Filtering by departureTime bucket:', filters.departureTime);
    }

    // exact time filter removed — only using bucket + date
    api.get("/trips/search", {
      params: searchParams,
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
            departure: departureTime ? departureTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : "",
            arrival: arrivalTime ? arrivalTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : "",
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
              trip.bus?.photo && trip.bus.photo.length > 0
                ? trip.bus.photo[0]
                : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
            description:
              trip.bus?.model && trip.bus?.amenities
                ? `${trip.bus.model} • ${Object.entries(trip.bus.amenities).filter(([_, v]) => v).map(([k, _]) => k.replace('_', ' ')).join(", ")}`
                : trip.bus?.model || "",
            category: trip.bus?.busType || "standard",
            rating: trip.averageRating ?? trip.operator?.averageRating ?? 0.0,
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
  }, [origin, destination, date, filters.departureTime, filters.date]);

  // Filter and sort results
  useEffect(() => {
    let filteredResults = [...allResults];

    // Apply filters
    if (filters.query) {
      filteredResults = filterWithVietnameseSearch(
        filteredResults,
        filters.query,
        (result) => [
          result.title,
          result.description,
          result.origin,
          result.destination,
          result.location || ''
        ]
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

    if (filters.from) {
      filteredResults = filteredResults.filter((result) =>
        matchesWithoutDiacritics(result.departure, filters.from)
      );
    }

    if (filters.to) {
      filteredResults = filteredResults.filter((result) =>
        matchesWithoutDiacritics(result.arrival, filters.to)
      );
    }

    // Filter by operator
    if (filters.operator) {
      filteredResults = filteredResults.filter((result) =>
        matchesWithoutDiacritics(result.title, filters.operator) ||
        matchesWithoutDiacritics(result.description, filters.operator)
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
      case "departure-asc":
        filteredResults.sort((a, b) => {
          // Sort by departure time (earliest first)
          const timeA = a.departure || "";
          const timeB = b.departure || "";
          return timeA.localeCompare(timeB);
        });
        break;
      case "departure-desc":
        filteredResults.sort((a, b) => {
          // Sort by departure time (latest first)
          const timeA = a.departure || "";
          const timeB = b.departure || "";
          return timeB.localeCompare(timeA);
        });
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
                placeholder="Search destinations, cities, or operators..."
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
                {/* <svg
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
                </svg> */}
                Filters
              </h3>

              {/* Bus Type */}
              <div className="space-y-3">
                <h4 className="text-h6 font-semibold text-foreground flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ticket text-primary" viewBox="0 0 16 16">
                    <path d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5V6a.5.5 0 0 1-.5.5 1.5 1.5 0 0 0 0 3 .5.5 0 0 1 .5.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 11.5V10a.5.5 0 0 1 .5-.5 1.5 1.5 0 1 0 0-3A.5.5 0 0 1 0 6zM1.5 4a.5.5 0 0 0-.5.5v1.05a2.5 2.5 0 0 1 0 4.9v1.05a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-1.05a2.5 2.5 0 0 1 0-4.9V4.5a.5.5 0 0 0-.5-.5z"/>
                  </svg>
                  Bus Type
                </h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {categories.map((type) => (
                    <div key={type} className="flex items-center space-x-2 text-sm">
                      <Checkbox
                        id={type}
                        checked={filters.category.includes(type)}
                        onCheckedChange={() => handleCategoryToggle(type)}
                        className="cursor-pointer h-4 w-4 bg-muted/60"
                      />
                      <label
                        htmlFor={type}
                        className="text-sm text-foreground cursor-pointer"
                      >
                        {formatBusTypeLabel(type)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departure Time */}
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
                  Departure Time
                </h4>
                  <div className="bg-muted/40 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30 space-y-2">
                    <div>
                      <Input
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="h-9 bg-background/90 dark:bg-black/95 border-border/60 dark:border-border/40 focus:border-primary text-sm transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <select
                        value={filters.departureTime}
                        onChange={(e) => handleFilterChange('departureTime', e.target.value)}
                        className="
                          w-full h-9
                          bg-background/90 dark:bg-black/95
                          border border-border/60 dark:border-border/40
                          focus:border-primary
                          text-sm rounded-md
                          pl-4 pr-10
                          transition-colors
                          cursor-pointer
                          appearance-none
                        "
                      >
                        <option value="">Any time</option>
                        <option value="morning">Morning (05:00-11:59)</option>
                        <option value="afternoon">Afternoon (12:00-16:59)</option>
                        <option value="evening">Evening (17:00-20:59)</option>
                        <option value="night">Night (21:00-04:59)</option>
                      </select>

                      {/* Arrow */}
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg
                          className="w-4 h-4 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
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
                  Price Range 
                </h4>
                <div className="bg-muted/40 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30">
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

              {/* From/To Locations
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
                  Locations
                </h4>
                <div className="bg-muted/40 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      From
                    </label>
                    <Input
                      placeholder="Departure city..."
                      value={filters.from}
                      onChange={(e) => handleFilterChange("from", e.target.value)}
                      className="h-9 bg-background/90 dark:bg-black/95 border-border/60 dark:border-border/40 focus:border-primary text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">
                      To
                    </label>
                    <Input
                      placeholder="Destination city..."
                      value={filters.to}
                      onChange={(e) => handleFilterChange("to", e.target.value)}
                      className="h-9 bg-background/90 dark:bg-black/95 border-border/60 dark:border-border/40 focus:border-primary text-sm transition-colors"
                    />
                  </div>
                </div>
              </div> */}

              {/* Bus Operator */}
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Bus Operator
                </h4>
                <div className="bg-muted/40 dark:bg-black/40 p-3 rounded-lg border border-border/50 dark:border-border/30">
                  <select
                    value={filters.operator}
                    onChange={(e) => handleFilterChange("operator", e.target.value)}
                    className="w-full h-9 bg-background/90 dark:bg-black/95 border border-border/60 dark:border-border/40 focus:border-primary text-sm rounded-md px-2 transition-colors cursor-pointer"
                  >
                    <option value="">All Operators</option>
                    {operators.map((operator) => (
                      <option key={operator} value={operator}>
                        {operator}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="pt-2 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({
                      query: "",
                      category: [],
                      minPrice: 0,
                      maxPrice: 500000,
                      from: "",
                      to: "",
                      operator: "",
                      departureTime: "",
                      date: "",
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
                {origin && destination ? (
                  <>
                    Found {results.length} trips for{" "}
                    <span className="font-semibold text-foreground">
                      {origin} → {destination}
                    </span>
                    {effectiveDateDisplay ? (
                      <>
                        {" "}on{" "}
                        <span className="font-semibold text-foreground">
                          {effectiveDateDisplay}
                        </span>
                        <span className="text-muted-foreground ml-2">• {effectiveTimeLabel}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground ml-2">({effectiveTimeLabel})</span>
                    )}
                    {passengers && (
                      <span>
                        {" "}
                        for {passengers} passenger
                        {Number(passengers) > 1 ? "s" : ""}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-destructive">
                    Please search with origin and destination to find trips.
                  </span>
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

            {!isLoading && (!origin || !destination) ? (
              <Card className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-h4 font-semibold text-foreground">Search for Trips</h3>
                  <p className="text-body text-muted-foreground max-w-md mx-auto">
                    Enter your origin and destination to find available trips. Date is optional - leave blank to see all trips.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Link href="/">
                      <Button className="cursor-pointer">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Go to Home
                      </Button>
                    </Link>
                    <Link href="/routes">
                      <Button variant="outline" className="cursor-pointer">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Browse Routes
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : !isLoading && currentResults.length > 0 ? (
              <>
                <div className="space-y-4">
                  {currentResults.map((result) => (
                    <Link key={result.id} href={`/trips/${result.id}`} className="block">
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary">
                        <CardContent className="p-3">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            {/* Trip Image */}
                            <div className="w-full lg:w-40 h-24 lg:h-24 relative overflow-hidden rounded-xl flex-shrink-0">
                              <img
                                src={result.image}
                                alt={result.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                              <div className="absolute top-2 left-2">
                                <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-lg text-xs font-medium">
                                  {result.category}
                                </span>
                              </div>
                              {result.rating > 0 && (
                                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded">
                                  <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-white text-xs font-medium">{result.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>

                            {/* Trip Details */}
                            <div className="flex-1 space-y-2">
                              <div className="space-y-1">
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                  {result.title}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span className="font-medium">{result.origin}</span>
                                  </div>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                                  </svg>
                                  <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    </svg>
                                    <span className="font-medium">{result.destination}</span>
                                  </div>
                                </div>
                                {result.departure && (
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs">{result.departure}</span>
                                    {result.arrival && <span className="text-xs"> • {result.arrival}</span>}
                                  </div>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {result.description}
                                </p>
                              </div>

                              {/* Trip Stats */}
                              <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg">
                                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  <span className="font-medium">{result.distance} km</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-lg">
                                  <svg className="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">{result.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg">
                                  <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-bold text-primary">{formatCurrency(result.price)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Arrow */}
                            <div className="flex-shrink-0">
                              <div className="bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary p-2 rounded-xl transition-all duration-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
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
                    No trips found
                  </h3>
                  <p className="text-body text-muted-foreground max-w-md mx-auto">
                    Try adjusting your search criteria or check different dates.
                  </p>
                  <Button
                    onClick={() => setFilters({
                      query: "",
                      category: [],
                      minPrice: 0,
                      maxPrice: 500000,
                      from: "",
                      to: "",
                      operator: "",
                      departureTime: "",
                      date: "",
                      sortBy: "newest",
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
                    Loading trips...
                  </h3>
                  <p className="text-body text-muted-foreground max-w-md mx-auto">
                    Please wait while we find suitable trips for you.
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