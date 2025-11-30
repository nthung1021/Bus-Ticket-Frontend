"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  const [searchData, setSearchData] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1
  });

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Search data:", searchData);
  };

  const featuredRoutes = [
    {
      id: 1,
      from: "New York",
      to: "Boston",
      price: 45,
      duration: "6h",
      image: "/placeholder-city-1.jpg"
    },
    {
      id: 2,
      from: "Los Angeles",
      to: "San Francisco",
      price: 55,
      duration: "8h",
      image: "/placeholder-city-2.jpg"
    },
    {
      id: 3,
      from: "Chicago",
      to: "Detroit",
      price: 35,
      duration: "5h",
      image: "/placeholder-city-3.jpg"
    },
    {
      id: 4,
      from: "Miami",
      to: "Orlando",
      price: 25,
      duration: "4h",
      image: "/placeholder-city-4.jpg"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="text-center space-y-6">
            <h1 className="text-h1 lg:text-5xl xl:text-6xl font-bold leading-tight">
              Your Journey Starts Here
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-2xl mx-auto">
              Book bus tickets easily and travel comfortably to your destination
            </p>
          </div>

          {/* Search Form */}
          <div className="mt-12 max-w-4xl mx-auto">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <label className="text-body font-medium text-foreground">From</label>
                    <Input
                      placeholder="Departure city"
                      value={searchData.from}
                      onChange={(e) => setSearchData({ ...searchData, from: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-body font-medium text-foreground">To</label>
                    <Input
                      placeholder="Destination city"
                      value={searchData.to}
                      onChange={(e) => setSearchData({ ...searchData, to: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-body font-medium text-foreground">Date</label>
                    <Input
                      type="date"
                      value={searchData.date}
                      onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-body font-medium text-foreground">Passengers</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={searchData.passengers}
                      onChange={(e) => setSearchData({ ...searchData, passengers: parseInt(e.target.value) })}
                      className="h-12"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSearch}
                      size="lg"
                      className="w-full h-12 text-base font-semibold"
                    >
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
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-h2 lg:text-4xl font-bold text-foreground">
              Popular Routes
            </h2>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular bus routes with great prices and comfortable journeys
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredRoutes.map((route) => (
              <Card key={route.id} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">Destination Image</span>
                  </div>
                  <div className="absolute bottom-4 left-4 z-20 text-white">
                    <p className="text-sm font-medium">{route.duration} journey</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <h3 className="text-h5 font-semibold text-foreground">
                      {route.from} → {route.to}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-h4 font-bold text-primary">
                        ${route.price}
                      </span>
                      <Button size="sm" className="group-hover:bg-primary/90">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-h2 lg:text-4xl font-bold">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of travelers who trust us for comfortable and reliable bus journeys across the country
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="text-base px-8 py-3">
              Explore All Routes
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 py-3 border-white text-white hover:bg-white hover:text-primary">
              Download App
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
