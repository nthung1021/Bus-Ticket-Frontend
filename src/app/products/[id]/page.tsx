"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface ProductParams {
  id: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
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

// Mock product data for bus routes
const mockProducts: Record<string, Product> = {
  "1": {
    id: "1",
    name: "Hồ Chí Minh - Đà Lạt Express",
    category: "Premium Bus Route",
    price: 350000,
    originalPrice: 400000,
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1469&auto=format&fit=crop",
    description: "Experience luxury travel from Ho Chi Minh City to the beautiful mountain city of Da Lat. Our premium express service offers comfortable seating, air conditioning, and scenic mountain views throughout your journey.",
    features: [
      "Luxury reclining seats",
      "Air conditioning",
      "WiFi connectivity",
      "Onboard refreshments",
      "Rest stops every 2 hours",
      "Professional driver service"
    ],
    duration: "7 hours",
    departure: "Hồ Chí Minh",
    arrival: "Đà Lạt",
    busType: "45-seat luxury coach",
    amenities: ["WiFi", "Air Conditioning", "Reclining Seats", "Refreshments"],
    departureTime: "06:00 AM",
    arrivalTime: "01:00 PM"
  },
  "2": {
    id: "2",
    name: "Hà Nội - Hạ Long Bay Tour",
    category: "Tourist Route",
    price: 280000,
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=1470&auto=format&fit=crop",
    description: "Discover the UNESCO World Heritage site of Ha Long Bay with our comfortable tourist bus service. Perfect for day trips and weekend getaways with stunning coastal views.",
    features: [
      "Scenic route along the coast",
      "Tour guide assistance",
      "Multiple pickup points",
      "Comfortable seating",
      "Safety equipment included"
    ],
    duration: "4 hours",
    departure: "Hà Nội",
    arrival: "Hạ Long",
    busType: "35-seat tourist bus",
    amenities: ["Tour Guide", "Scenic Views", "Multiple Stops"],
    departureTime: "08:00 AM",
    arrivalTime: "12:00 PM"
  },
  "3": {
    id: "3",
    name: "Đà Nẵng - Hội An Heritage",
    category: "Cultural Route",
    price: 120000,
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1470&auto=format&fit=crop",
    description: "Short and convenient route connecting the modern city of Da Nang to the ancient town of Hoi An. Experience the contrast between contemporary urban life and traditional Vietnamese culture.",
    features: [
      "Quick 1-hour journey",
      "Frequent departures",
      "Cultural site access",
      "Historic route information",
      "Local guide recommendations"
    ],
    duration: "1 hour",
    departure: "Đà Nẵng",
    arrival: "Hội An",
    busType: "25-seat shuttle",
    amenities: ["Frequent Service", "Cultural Info", "Local Tips"],
    departureTime: "Every 30 minutes",
    arrivalTime: "Various"
  }
};

export default function ProductDetailPage({ params }: { params: Promise<ProductParams> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    // Simulate API call
    const fetchProduct = async () => {
      setLoading(true);
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const foundProduct = mockProducts[resolvedParams.id];
      setProduct(foundProduct || null);
      setLoading(false);
    };

    fetchProduct();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12 px-6 lg:px-8 xl:px-12 space-y-12 max-w-7xl">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="aspect-[4/3] bg-muted rounded-xl animate-pulse"></div>
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

  if (!product) {
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

  const relatedProducts = Object.values(mockProducts)
    .filter(p => p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-6 lg:px-8 xl:px-12 space-y-12 max-w-7xl">
      {/* Main Product Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 group cursor-pointer hover:shadow-lg transition-all duration-300">
            <img 
              src={product.image}
              alt={product.name}
              className="w-full aspect-[4/3] rounded-xl object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="aspect-video bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-center">
              <span className="text-caption text-muted-foreground">View 1</span>
            </div>
            <div className="aspect-video bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-center">
              <span className="text-caption text-muted-foreground">View 2</span>
            </div>
            <div className="aspect-video bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors flex items-center justify-center">
              <span className="text-caption text-muted-foreground">View 3</span>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="inline-block">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-caption font-medium">
                {product.category}
              </span>
            </div>
            <h1 className="text-h1 text-foreground leading-tight">{product.name}</h1>
          </div>

          {/* Price */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-4">
              <span className="text-h3 text-primary font-bold">
                {product.price.toLocaleString('vi-VN')} VNĐ
              </span>
              {product.originalPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-body text-muted-foreground line-through">
                    {product.originalPrice.toLocaleString('vi-VN')} VNĐ
                  </span>
                  <span className="bg-destructive/10 text-destructive px-2 py-1 rounded text-caption font-medium">
                    Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Route Details */}
          <Card className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border rounded-xl p-6 space-y-6">
            <h3 className="text-h5 text-foreground font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Route Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-h6 text-foreground mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    Departure
                  </h4>
                  <p className="text-body font-medium">{product.departure}</p>
                  <p className="text-caption text-muted-foreground">{product.departureTime}</p>
                </div>
                <div>
                  <h4 className="text-h6 text-foreground mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    Duration
                  </h4>
                  <p className="text-body font-medium">{product.duration}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-h6 text-foreground mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    Arrival
                  </h4>
                  <p className="text-body font-medium">{product.arrival}</p>
                  <p className="text-caption text-muted-foreground">{product.arrivalTime}</p>
                </div>
                <div>
                  <h4 className="text-h6 text-foreground mb-2 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    Bus Type
                  </h4>
                  <p className="text-body font-medium">{product.busType}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quantity Selector */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <label className="text-h6 text-foreground font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Number of Tickets
            </label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  disabled={selectedQuantity <= 1}
                >
                  -
                </Button>
                <span className="text-h5 font-semibold w-12 text-center bg-muted rounded-lg py-2">{selectedQuantity}</span>
                <Button
                  onClick={() => setSelectedQuantity(Math.min(10, selectedQuantity + 1))}
                  variant="outline"
                  size="sm"
                  className="w-10 h-10 rounded-full cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  disabled={selectedQuantity >= 10}
                >
                  +
                </Button>
              </div>
              <div className="text-right">
                <p className="text-caption text-muted-foreground">Total Price</p>
                <p className="text-h5 font-bold text-primary">
                  {(product.price * selectedQuantity).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button className="bg-primary text-primary-foreground rounded-xl px-8 py-4 hover:bg-primary/90 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-xl">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13h10M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="font-semibold">Book Now</span>
            </Button>
            <Button variant="outline" className="border-2 border-border text-foreground rounded-xl px-8 py-4 hover:bg-accent transition-all duration-200 cursor-pointer group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="font-semibold">Save Route</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-card border border-border rounded-2xl p-8 space-y-6">
        <h2 className="text-h3 text-foreground flex items-center gap-3">
          <div className="w-2 h-8 bg-primary rounded-full"></div>
          Route Description
        </h2>
        <p className="text-body leading-relaxed text-foreground text-lg">
          {product.description}
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
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-4 group cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
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
            {product.amenities.map((amenity, index) => (
              <div key={index} className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border rounded-xl p-4 text-center group hover:from-primary/5 hover:to-primary/10 hover:border-primary/20 transition-all duration-200 cursor-pointer">
                <div className="w-8 h-8 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-body text-foreground font-medium">{amenity}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Related Routes */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-h3 text-foreground flex items-center justify-center gap-3">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            Other Popular Routes
            <div className="w-2 h-8 bg-primary rounded-full"></div>
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Discover more amazing destinations with our comfortable bus services
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedProducts.map((relatedProduct) => (
            <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`} className="group cursor-pointer">
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] h-full">
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <img 
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-caption font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                      {relatedProduct.duration}
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
                      {relatedProduct.name}
                    </h3>
                    <p className="text-caption text-muted-foreground flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {relatedProduct.departure} → {relatedProduct.arrival}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-h6 font-bold text-primary">
                      {relatedProduct.price.toLocaleString('vi-VN')} VNĐ
                    </span>
                    <Button size="sm" className="group-hover:bg-primary/90 text-caption cursor-pointer px-4 py-2">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}