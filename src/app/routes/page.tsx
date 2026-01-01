"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Route } from "@/services/route.service";
import { routeService } from "@/services/route.service";
import { filterWithVietnameseSearch, matchesWithoutDiacritics } from "@/utils/vietnameseSearch";

// Route filters interface
interface RouteFilters {
  query: string;
  minDistance: number;
  maxDistance: number;
  from: string;
  to: string;
  category: string[];
  operator: string;
  sortBy: string;
}

// Route result data
interface RouteResult {
  id: string;
  title: string;
  origin: string;
  destination: string;
  distance: number;
  duration: string;
  image: string;
  description: string;
  category: string;
  // rating: number;
  estimatedMinutes: number;
  distanceKm: number;
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "distance-asc", label: "Distance: Short to Long" },
  { value: "distance-desc", label: "Distance: Long to Short" },
  { value: "rating", label: "Highest Rated" },
];

// Convert Route to RouteResult
const convertRouteToResult = (route: Route): RouteResult => ({
  id: route.id,
  title: route.name || `${route.origin} to ${route.destination}`,
  origin: route.origin || 'Unknown',
  destination: route.destination || 'Unknown',
  distance: Number(route.distanceKm) || 0,
  duration: `${Math.floor((route.estimatedMinutes || 0) / 60)}h${(route.estimatedMinutes || 0) % 60 ? ` ${(route.estimatedMinutes || 0) % 60}m` : ''}`,
  image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
  description: route.description || `Route from ${route.origin} to ${route.destination}`,
  category: (Number(route.distanceKm) > 300) ? "Premium" : "Standard",
  estimatedMinutes: route.estimatedMinutes || 0,
  distanceKm: Number(route.distanceKm) || 0
});

export default function RoutesPage() {
  const [filters, setFilters] = useState<RouteFilters>({
    query: "",
    minDistance: 0,
    maxDistance: 1000,
    from: "",
    to: "",
    category: [],
    operator: "",
    sortBy: "newest",
  });

  const [allRoutes, setAllRoutes] = useState<RouteResult[]>([]);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 9;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load operators from API
  useEffect(() => {
    routeService.getAllSimple()
      .then((routesData) => {
        // Extract unique operator names from routes
        const uniqueOperators = Array.from(
          new Set(
            routesData
              .map(r => r.operator?.name)
              .filter((name): name is string => !!name)
          )
        ).sort();
        setOperators(uniqueOperators);
        console.log('✅ Loaded operators:', uniqueOperators);
        
        // Extract unique categories from routes
        const uniqueCategories = Array.from(
          new Set(
            routesData.map(r => {
              const km = Number(r.distanceKm) || 0;
              return km > 300 ? "Premium" : "Standard";
            })
          )
        ).sort();
        setCategories(uniqueCategories);
        console.log('✅ Loaded categories:', uniqueCategories);
      })
      .catch((err) => {
        console.error('❌ Failed to load operators:', err);
      });
  }, []);

  // Load all routes
  useEffect(() => {
    console.log('🛣️ Loading all routes');
    setIsLoading(true);
    setError(null);
    
    routeService.getAllSimple()
      .then((routesData) => {
        console.log('✅ Loaded routes:', routesData.length);
        
        const mapped: RouteResult[] = routesData.map(convertRouteToResult);
        setAllRoutes(mapped);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
          "Failed to load routes. Please try again.",
        );
      })
      .finally(() => {
        setIsLoading(false);
        setLoading(false);
      });
  }, []);

  // Filter and sort routes
  useEffect(() => {
    let filteredRoutes = [...allRoutes];

    // Apply filters
    if (filters.query) {
      filteredRoutes = filterWithVietnameseSearch(
        filteredRoutes,
        filters.query,
        (route) => [
          route.title,
          route.description,
          route.origin,
          route.destination
        ]
      );
    }

    if (filters.category.length > 0) {
      filteredRoutes = filteredRoutes.filter((route) =>
        filters.category.includes(route.category)
      );
    }

    filteredRoutes = filteredRoutes.filter((route) =>
      route.distance >= filters.minDistance && route.distance <= filters.maxDistance
    );

    if (filters.from) {
      filteredRoutes = filteredRoutes.filter((route) =>
        matchesWithoutDiacritics(route.origin, filters.from)
      );
    }

    if (filters.to) {
      filteredRoutes = filteredRoutes.filter((route) =>
        matchesWithoutDiacritics(route.destination, filters.to)
      );
    }

    // Filter by operator
    if (filters.operator) {
      filteredRoutes = filteredRoutes.filter((route) =>
        matchesWithoutDiacritics(route.title, filters.operator)
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "distance-asc":
        filteredRoutes.sort((a, b) => a.distance - b.distance);
        break;
      case "distance-desc":
        filteredRoutes.sort((a, b) => b.distance - a.distance);
        break;
      // case "rating":
      //   filteredRoutes.sort((a, b) => b.rating - a.rating);
      //   break;
      case "newest":
      default:
        // Keep original order
        break;
    }

    setRoutes(filteredRoutes);
    setCurrentPage(1);
  }, [filters, allRoutes]);

  const handleSearch = () => {
    console.log("Search triggered with query:", filters.query);
  };

  const handleFilterChange = (key: keyof RouteFilters, value: any) => {
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
  const totalPages = Math.ceil(routes.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const currentRoutes = routes.slice(startIndex, startIndex + resultsPerPage);

  return (
    <div className="min-h-screen bg-background">
      {/* Search Bar */}
      <section className="bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 lg:px-8 xl:px-12 py-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search routes, cities, or destinations..."
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                className="h-12 text-body bg-background border-border focus:border-primary transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer px-6 h-12"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Routes
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="xl:hidden border-border hover:bg-accent cursor-pointer px-4 h-12"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Filters
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 lg:px-8 xl:px-12 py-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Compact Filter Sidebar */}
          <aside className={`xl:block ${isFilterOpen ? "block" : "hidden"} xl:col-span-1 space-y-4`}>
            <Card className="bg-card backdrop-blur-sm border border-border rounded-2xl p-4 shadow-md">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
              </h3>

              {/* Distance Range - Compact */}
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-foreground">Distance (km)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minDistance}
                    onChange={(e) => handleFilterChange("minDistance", parseInt(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange("maxDistance", parseInt(e.target.value) || 1000)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* From/To - Compact */}
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-foreground">Locations</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="From..."
                    value={filters.from}
                    onChange={(e) => handleFilterChange("from", e.target.value)}
                    className="h-9 text-sm"
                  />
                  <Input
                    placeholder="To..."
                    value={filters.to}
                    onChange={(e) => handleFilterChange("to", e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Operator Filter */}
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-foreground">Bus Operator</h4>
                <select
                  value={filters.operator}
                  onChange={(e) => handleFilterChange("operator", e.target.value)}
                  className="w-full h-9 text-sm bg-background border border-border rounded-md px-2 cursor-pointer"
                >
                  <option value="">All Operators</option>
                  {operators.map((operator) => (
                    <option key={operator} value={operator}>
                      {operator}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category - Compact */}
              <div className="space-y-2">
                <h4 className="text-base font-semibold text-foreground">Category</h4>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2 text-sm">
                      <Checkbox
                        id={category}
                        checked={filters.category.includes(category)}
                        onCheckedChange={() => handleCategoryToggle(category)}
                        className="cursor-pointer h-4 w-4 bg-muted/60"
                      />
                      <label htmlFor={category} className="text-sm text-foreground cursor-pointer">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    query: "",
                    minDistance: 0,
                    maxDistance: 1000,
                    from: "",
                    to: "",
                    category: [],
                    operator: "",
                    sortBy: "newest",
                  });
                }}
                className="w-full h-8 text-xs cursor-pointer"
              >
                Clear All
              </Button>
            </Card>
          </aside>

          {/* Main Content - List Layout */}
          <main className="xl:col-span-4 space-y-6">
            {/* Sort Controls & Results Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-body text-muted-foreground">
                Found {routes.length} available routes
                {filters.query && <span> for "{filters.query}"</span>}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-body text-foreground">Sort by:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-body cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
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
              <Card className="bg-destructive/10 border border-destructive/40 rounded-xl p-6 mb-4">
                <p className="text-body text-destructive">{error}</p>
              </Card>
            )}

            {!isLoading && currentRoutes.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentRoutes.map((route) => (
                    <Link 
                      key={route.id} 
                      href={`/search?origin=${encodeURIComponent(route.origin)}&destination=${encodeURIComponent(route.destination)}`}
                      className="block"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img
                            src={route.image}
                            alt={route.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-4 right-4">
                            <span className="bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-caption font-medium backdrop-blur-sm">
                              {route.category}
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4 text-white">
                            <p className="text-caption bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                              {route.distance} km • {route.duration}
                            </p>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <h3 className="text-h5 font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {route.title}
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
                                {route.origin} → {route.destination}
                              </p>
                              <p className="text-body text-muted-foreground line-clamp-2">
                                {route.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-end pt-2">
                              <div className="bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary px-4 py-2 rounded-lg transition-all duration-300">
                                Search Trips
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
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                )}
              </>
            ) : !isLoading ? (
              <Card className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <h3 className="text-h4 font-semibold text-foreground">No routes found</h3>
                  <p className="text-body text-muted-foreground max-w-md mx-auto">
                    Try adjusting your filters or search terms to find more routes.
                  </p>
                  <Button
                    onClick={() => setFilters({
                      query: "",
                      minDistance: 0,
                      maxDistance: 1000,
                      from: "",
                      to: "",
                      category: [],
                      operator: "",
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
              <Card className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center animate-spin">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-h4 font-semibold text-foreground">Loading routes...</h3>
                  <p className="text-body text-muted-foreground max-w-md mx-auto">
                    Please wait while we load all available routes for you.
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