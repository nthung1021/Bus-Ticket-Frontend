"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { routeService, Route } from "@/services/route.service";
import { formatCurrency } from "@/utils/formatCurrency";

export default function Home() {
  const router = useRouter();
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1
  });

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState({
    from: false,
    to: false,
    date: false
  });
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  // Refs for animation elements
  const featuredRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const routeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  // Popular cities for autocomplete
  const popularCities = [
    "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Biên Hòa",
    "Huế", "Nha Trang", "Buôn Ma Thuột", "Thái Nguyên", "Phan Thiết", "Thủ Dầu Một",
    "Nam Định", "Quy Nhon", "Vũng Tàu", "Xã Tân An", "Long Xuyên", "Rạch Giá",
    "Cà Mau", "Uông Bí", "Dĩ An", "Việt Trì", "Mỹ Tho", "Hạ Long", "Bắc Giang",
    "Ninh Bình", "Thanh Hóa", "Hưng Yên", "Việt Yên", "Vĩnh Long", "Tân An",
    "Bến Tre", "Sóc Trăng", "Kon Tum", "Tuy Hòa", "Đông Hà", "Pleiku",
    "Châu Đốc", "Hà Tĩnh", "Hòa Bình", "Cao Lãnh", "Đồng Hới", "Lai Châu",
    "Lạng Sơn", "Lào Cai", "Sơn La", "Yên Bái", "Điện Biên Phủ", "Hà Giang",
    "Cao Bằng", "Bắc Kạn", "Tuyên Quang", "Phú Thọ"
  ];

  // Background images for automatic transition
  const backgroundImages = [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop", // Bus on highway
    "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1470&auto=format&fit=crop", // City skyline
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1470&auto=format&fit=crop", // Mountain road
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1470&auto=format&fit=crop", // Coastal highway
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1470&auto=format&fit=crop", // Urban bridge
  ];

  // Auto-change background every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Fetch popular routes from database
  useEffect(() => {
    const fetchPopularRoutes = async () => {
      try {
        setRoutesLoading(true);
        console.log('🔍 Fetching routes from API...');
        const routes = await routeService.getAll();
        console.log('✅ Routes fetched successfully:', routes);
        console.log('📊 Number of routes:', routes.length);
        
        // Filter routes that have trips and match them with actual trip dates
        const routesWithTrips = [
          { route: routes.find(r => r.origin === 'Ho Chi Minh' && r.destination === 'Nha Trang'), date: '2025-12-05' },
          { route: routes.find(r => r.origin === 'Ho Chi Minh' && r.destination === 'Da Lat'), date: '2025-12-06' },
          { route: routes.find(r => r.origin === 'Ha Noi' && r.destination === 'Hai Phong'), date: '2025-12-07' },
          { route: routes.find(r => r.origin === 'Da Nang' && r.destination === 'Hue'), date: '2025-12-08' }
        ].filter(item => item.route); // Remove undefined routes
        
        // Transform routes to include pricing and images
        const transformedRoutes = routesWithTrips.slice(0, 4).map((item, index) => {
          const route = item.route!;
          const basePrice = 150000 + (index * 50000); // Generate varied pricing in VND
          const duration = Math.ceil(route.estimatedMinutes / 60); // Convert to hours
          const images = [
            "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1470&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1470&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1470&auto=format&fit=crop"
          ];
          
          return {
            id: route.id,
            from: route.origin,
            to: route.destination,
            price: basePrice,
            duration: `${duration}h`,
            image: images[index % images.length],
            distanceKm: typeof route.distanceKm === 'string' ? parseFloat(route.distanceKm) : route.distanceKm,
            routeData: route,
            searchDate: item.date
          };
        });
        
        console.log('🎯 Transformed routes for display:', transformedRoutes);
        setPopularRoutes(transformedRoutes);
      } catch (error) {
        console.error('❌ Error fetching popular routes:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          response: (error as any)?.response?.data,
          status: (error as any)?.response?.status
        });
        // Fallback to sample data if API fails - using routes that actually have trips
        const fallbackRoutes = [
          {
            id: "fallback-1",
            from: "Ho Chi Minh",
            to: "Nha Trang",
            price: 350000,
            duration: "7h",
            image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
            searchDate: "2025-12-05"
          },
          {
            id: "fallback-2",
            from: "Ho Chi Minh", 
            to: "Da Lat",
            price: 220000,
            duration: "6h",
            image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1470&auto=format&fit=crop",
            searchDate: "2025-12-06"
          },
          {
            id: "fallback-3",
            from: "Ha Noi",
            to: "Hai Phong", 
            price: 90000,
            duration: "3h",
            image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1470&auto=format&fit=crop",
            searchDate: "2025-12-07"
          },
          {
            id: "fallback-4",
            from: "Da Nang",
            to: "Hue",
            price: 120000,
            duration: "2h",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1470&auto=format&fit=crop",
            searchDate: "2025-12-08"
          }
        ];
        setPopularRoutes(fallbackRoutes);
      } finally {
        setRoutesLoading(false);
      }
    };

    fetchPopularRoutes();
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleElements(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elementsToObserve = [
      featuredRef.current,
      featuresRef.current,
      ctaRef.current,
      ...routeRefs.current
    ].filter(Boolean);

    elementsToObserve.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [popularRoutes]); // Re-run when popularRoutes changes

  const isVisible = (id: string) => visibleElements.has(id);

  // Function to remove Vietnamese diacritics for better search
  const removeDiacritics = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  const toUnsignedName = (str: string): string => {
    const normalized = removeDiacritics(str || '').trim();
    if (!normalized) return '';
    return normalized
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter cities based on input with diacritic-insensitive search
  const filterCities = (input: string): string[] => {
    if (!input.trim()) return [];
    const normalizedInput = removeDiacritics(input);

    return popularCities
      .filter(city => {
        const normalizedCity = removeDiacritics(city);
        return normalizedCity.includes(normalizedInput) ||
          city.toLowerCase().includes(input.toLowerCase());
      })
      .slice(0, 5);
  };

  // Handle from city input
  const handleFromChange = (value: string) => {
    setSearchData({ ...searchData, from: value });
    const suggestions = filterCities(value);
    setFromSuggestions(suggestions);
    setShowFromSuggestions(suggestions.length > 0 && value.length > 0);
  };

  // Handle to city input
  const handleToChange = (value: string) => {
    setSearchData({ ...searchData, to: value });
    const suggestions = filterCities(value);
    setToSuggestions(suggestions);
    setShowToSuggestions(suggestions.length > 0 && value.length > 0);
  };

  // Select suggestion
  const selectFromCity = (city: string) => {
    setSearchData({ ...searchData, from: city });
    setShowFromSuggestions(false);
  };

  const selectToCity = (city: string) => {
    setSearchData({ ...searchData, to: city });
    setShowToSuggestions(false);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromInputRef.current && !fromInputRef.current.contains(event.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toInputRef.current && !toInputRef.current.contains(event.target as Node)) {
        setShowToSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    // Validate all fields
    const errors = {
      from: !searchData.from.trim(),
      to: !searchData.to.trim(),
      date: !searchData.date
    };

    setValidationErrors(errors);

    // If all fields are valid, proceed with search
    if (!errors.from && !errors.to && !errors.date) {
      const query = new URLSearchParams({
        origin: toUnsignedName(searchData.from),
        destination: toUnsignedName(searchData.to),
        date: searchData.date,
        passengers: String(searchData.passengers ?? 1),
      });

      router.push(`/search?${query.toString()}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Images with Transitions */}
        <div className="absolute inset-0">
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-2000 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"
                }`}
              style={{
                backgroundImage: `url(${image})`,
              }}
            />
          ))}
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center items-center text-white">
          <div className="text-center space-y-8 mb-16">
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight">
              Your Journey Starts Here
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              Book bus tickets easily and travel comfortably to your destination
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-6xl mx-auto">
            <Card className="bg-white/95 dark:bg-black/90 backdrop-blur-sm rounded-4xl shadow-lg dark:shadow-2xl overflow-visible border-0 dark:border dark:border-border/30">
              <CardContent className="p-2 mx-12 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-4 overflow-visible">
                  <div className="space-y-2 relative" ref={fromInputRef}>
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      From
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Enter departure city"
                        value={searchData.from}
                        onChange={(e) => {
                          handleFromChange(e.target.value);
                          if (validationErrors.from && e.target.value.trim()) {
                            setValidationErrors(prev => ({ ...prev, from: false }));
                          }
                        }}
                        onFocus={() => {
                          if (searchData.from.length > 0) {
                            const suggestions = filterCities(searchData.from);
                            setFromSuggestions(suggestions);
                            setShowFromSuggestions(suggestions.length > 0);
                          }
                        }}
                        className={`h-10 pr-10 bg-background/90 dark:bg-black/80 border-border/60 dark:border-border/40 focus:border-primary transition-colors ${validationErrors.from ? 'border-foreground dark:border-white focus:border-foreground dark:focus:border-white' : ''
                          }`}
                        autoComplete="off"
                      />
                      {validationErrors.from && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1">
                          <p className="text-foreground dark:text-white text-xs bg-background/95 dark:bg-black/95 border border-border/50 dark:border-white/20 rounded px-2 py-1 shadow-lg backdrop-blur-sm flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Please enter departure city
                          </p>
                        </div>
                      )}
                      {showFromSuggestions && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-black/95 border border-border dark:border-border/40 rounded-md shadow-xl z-[104] mt-1 max-h-48 overflow-y-auto">
                          {fromSuggestions.map((city, index) => (
                            <div
                              key={index}
                              onClick={() => selectFromCity(city)}
                              className="px-3 py-2 hover:bg-muted dark:hover:bg-gray-800/50 cursor-pointer text-sm border-b dark:border-border/20 last:border-b-0 transition-colors text-foreground"
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 relative" ref={toInputRef}>
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      To
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Enter destination city"
                        value={searchData.to}
                        onChange={(e) => {
                          handleToChange(e.target.value);
                          if (validationErrors.to && e.target.value.trim()) {
                            setValidationErrors(prev => ({ ...prev, to: false }));
                          }
                        }}
                        onFocus={() => {
                          if (searchData.to.length > 0) {
                            const suggestions = filterCities(searchData.to);
                            setToSuggestions(suggestions);
                            setShowToSuggestions(suggestions.length > 0);
                          }
                        }}
                        className={`h-10 pr-10 bg-background/90 dark:bg-black/80 border-border/60 dark:border-border/40 focus:border-primary transition-colors ${validationErrors.to ? 'border-foreground dark:border-white focus:border-foreground dark:focus:border-white' : ''
                          }`}
                        autoComplete="off"
                      />
                      {validationErrors.to && (
                        <div className="absolute top-full left-0 right-0 z-49 mt-1">
                          <p className="text-foreground dark:text-white text-xs bg-background/95 dark:bg-black/95 border border-border/50 dark:border-white/20 rounded px-2 py-1 shadow-lg backdrop-blur-sm flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Please enter destination city
                          </p>
                        </div>
                      )}
                      {showToSuggestions && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-black/95 border border-border dark:border-border/40 rounded-md shadow-xl z-[104] mt-1 max-h-48 overflow-y-auto">
                          {toSuggestions.map((city, index) => (
                            <div
                              key={index}
                              onClick={() => selectToCity(city)}
                              className="px-3 py-2 hover:bg-muted dark:hover:bg-gray-800/50 cursor-pointer text-sm border-b dark:border-border/20 last:border-b-0 transition-colors text-foreground"
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Departure Date
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={searchData.date}
                        onChange={(e) => {
                          setSearchData({ ...searchData, date: e.target.value });
                          if (validationErrors.date && e.target.value) {
                            setValidationErrors(prev => ({ ...prev, date: false }));
                          }
                        }}
                        min={getMinDate()}
                        className={`h-10 cursor-pointer bg-background/90 dark:bg-black/80 border-border/60 dark:border-border/40 focus:border-primary transition-colors ${validationErrors.date ? 'border-foreground dark:border-white focus:border-foreground dark:focus:border-white' : ''
                          }`}
                      />
                      {validationErrors.date && (
                        <div className="absolute top-full left-0 right-0 z-48 mt-1">
                          <p className="text-foreground dark:text-white text-xs bg-background/95 dark:bg-black/95 border border-border/50 dark:border-white/20 rounded px-2 py-1 shadow-lg backdrop-blur-sm flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Please select departure date
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Passengers
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={searchData.passengers}
                      onChange={(e) => setSearchData({ ...searchData, passengers: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="h-10 cursor-pointer bg-background/90 dark:bg-black/80 border-border/60 dark:border-border/40 focus:border-primary transition-colors"
                      placeholder="1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleSearch}
                      size="lg"
                      className="w-full h-10 text-base font-semibold cursor-pointer bg-primary hover:bg-primary/90 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search Buses
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Routes Section */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={featuredRef}
            id="featured-header"
            className={`text-center space-y-4 mb-12 transition-all duration-1000 ease-out ${isVisible('featured-header')
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
              }`}
          >
            <h2 className="text-h2 font-bold text-foreground">
              Popular Routes
            </h2>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular bus routes with great prices and comfortable journeys
            </p>
          </div>

          {routesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading popular routes...</p>
            </div>
          ) : popularRoutes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No popular routes available at the moment.</p>
              <p className="text-sm text-muted-foreground mt-2">Please check back later or use the search function above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularRoutes.map((route, index) => (
              <div
                key={route.id}
                ref={(el) => { routeRefs.current[index] = el; }}
                id={`route-${route.id}`}
                className={`transition-all duration-1000 ease-out opacity-100 translate-y-0`}
                style={{
                  transitionDelay: `${index * 150}ms`
                }}
              >
                <Link href={`/search?origin=${encodeURIComponent(route.from)}&destination=${encodeURIComponent(route.to)}&date=${route.searchDate}&passengers=1`} className="block h-full">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer h-full">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      <img
                        src={route.image}
                        alt={`${route.from} to ${route.to}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                      <div className="absolute bottom-4 left-4 z-20 text-white">
                        <p className="text-sm font-medium bg-black/30 px-2 py-1 rounded">{route.duration} journey</p>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <h3 className="text-h5 font-semibold text-foreground">
                          {route.from} → {route.to}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-h4 font-bold text-primary">
                            {formatCurrency(route.price)}
                          </span>
                          <Button size="sm" className="group-hover:bg-primary/90 cursor-pointer">
                            Book Route
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={featuresRef}
            id="features"
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 ease-out ${isVisible('features')
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
              }`}
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-h4 font-semibold text-foreground">Fast Booking</h3>
              <p className="text-body text-muted-foreground">
                Book your tickets in just a few clicks with our streamlined booking process
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-7V5a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2z" />
                </svg>
              </div>
              <h3 className="text-h4 font-semibold text-foreground">Secure Payments</h3>
              <p className="text-body text-muted-foreground">
                Safe and secure payment processing with multiple payment options available
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-h4 font-semibold text-foreground">Real-Time Updates</h3>
              <p className="text-body text-muted-foreground">
                Get live updates on departure times, delays, and route changes instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div
          ref={ctaRef}
          id="cta"
          className={`max-w-4xl mx-auto px-6 text-center space-y-6 transition-all duration-1000 ease-out ${isVisible('cta')
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
            }`}
        >
          <h2 className="text-h2 font-bold">
            Ready to Start Your Journey?
          </h2>
          <p className="text-body opacity-90 max-w-2xl mx-auto">
            Join thousands of travelers who trust us for comfortable and reliable bus journeys across the country
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/products/1">
              <Button size="lg" variant="secondary" className="text-base px-8 py-3 cursor-pointer">
                Explore All Routes
              </Button>
            </Link>
            <Link href="/products/2">
              <Button size="lg" variant="secondary" className="text-base px-8 py-3 cursor-pointer">
                Book Popular Route
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
