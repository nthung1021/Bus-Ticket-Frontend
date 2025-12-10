"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bus, Users, Check, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency } from "@/utils/formatCurrency";

interface SeatData {
  id: string;
  code: string;
  type: 'normal' | 'vip' | 'business';
  price: number;
  isAvailable: boolean;
  isSelected?: boolean;
}

interface SeatSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  maxSeats: number;
  onConfirm: (selectedSeats: SeatData[]) => void;
}

export default function SeatSelectionDialog({ 
  open, 
  onOpenChange, 
  tripId, 
  maxSeats, 
  onConfirm 
}: SeatSelectionDialogProps) {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SeatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchSeats = async (tripId: string) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🪑 Fetching seats for trip:', tripId);
      
      // Get trip details to get busId
      const tripResponse = await api.get(`/trips/${tripId}`);
      const trip = tripResponse.data.data;
      const busId = trip.bus?.busId;
      
      if (!busId) {
        throw new Error('Bus ID not found for this trip');
      }
      
      console.log('🚌 Bus ID:', busId);
      
      // Get seats for this bus
      const seatsResponse = await api.get(`/database/seats/bus/${busId}`);
      const seatsData = seatsResponse.data;
      
      if (!seatsData.success) {
        throw new Error(seatsData.error || 'Failed to fetch seats');
      }

      // If seat data is empty, just create mock seats (for demo only, need to throw error when happens)
      if (seatsData.seats.length === 0)     
        setSeats(generateMockSeats());
      
      else {
        console.log('🪑 Raw seats data:', seatsData);
        
        // Transform backend seat data to frontend format
        const transformedSeats: SeatData[] = seatsData.seats.map((seat: any) => ({
          id: seat.id,
          code: seat.seatCode,
          type: seat.seatType as 'normal' | 'vip' | 'business',
          price: getSeatPrice(seat.seatType),
          isAvailable: seat.isActive, // Use isActive as availability
          isSelected: false
        }));
        
        console.log('🪑 Transformed seats:', transformedSeats);
        setSeats(transformedSeats);
      }  
    } catch (error: any) {
      console.error('❌ Error fetching seats:', error);
      setError(error.message || 'Failed to load seats');
      
      // Fallback to mock data for development
      console.log('🔄 Using fallback mock seats...');
      setSeats(generateMockSeats());
    } finally {
      setLoading(false);
    }
  };

  const getSeatPrice = (seatType: string): number => {
    switch (seatType) {
      case 'business': return 350000;
      case 'vip': return 250000;
      case 'normal': 
      default: return 150000;
    }
  };

  // Keep mock as fallback for development
  const generateMockSeats = (): SeatData[] => {
    const seats: SeatData[] = [];
    
    // Generate seats matching database structure
    // Row 1: Business class (1A, 1B, 1C, 1D)
    for (let col of ['A', 'B', 'C', 'D']) {
      seats.push({
        id: `1-${col}`,
        code: `1${col}`,
        type: 'business',
        price: 350000,
        isAvailable: true,
        isSelected: false
      });
    }
    
    // Rows 2-10: Normal class
    for (let row = 2; row <= 10; row++) {
      for (let col of ['A', 'B', 'C', 'D']) {
        seats.push({
          id: `${row}-${col}`,
          code: `${row}${col}`,
          type: 'normal',
          price: 150000,
          isAvailable: Math.random() > 0.2, // 80% availability
          isSelected: false
        });
      }
    }
    
    return seats;
  };

  useEffect(() => {
    if (open && tripId) {
      fetchSeats(tripId);
    } else {
      // Reset states when dialog closes
      setSelectedSeats([]);
      setError('');
    }
  }, [open, tripId]);

  const toggleSeatSelection = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || !seat.isAvailable) return;

    const isCurrentlySelected = selectedSeats.some(s => s.id === seatId);
    
    if (isCurrentlySelected) {
      // Remove seat from selection
      setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
    } else {
      // Add seat to selection if under limit
      if (selectedSeats.length < maxSeats) {
        setSelectedSeats(prev => [...prev, seat]);
      }
    }
  };

  const getSeatClass = (seat: SeatData) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    let baseClass = "w-8 h-8 rounded border-2 text-xs font-medium flex items-center justify-center cursor-pointer transition-all duration-200 ";
    
    if (!seat.isAvailable) {
      return baseClass + "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
    }
    
    if (isSelected) {
      return baseClass + "bg-primary border-primary text-white ring-2 ring-primary ring-offset-1";
    }
    
    switch (seat.type) {
      case 'business':
        return baseClass + "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100";
      case 'vip':
        return baseClass + "bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100";
      default:
        return baseClass + "bg-green-50 border-green-300 text-green-700 hover:bg-green-100";
    }
  };

  const getTotalPrice = () => {
    return selectedSeats.reduce((total, seat) => total + seat.price, 0);
  };

  const handleConfirm = () => {
    if (selectedSeats.length > 0) {
      onConfirm(selectedSeats);
      onOpenChange(false);
    }
  };

  // Group seats by row for display
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = parseInt(seat.code);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<number, SeatData[]>);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Seat Selection</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading seat map...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seat Selection Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={() => fetchSeats(tripId)}
                disabled={loading}
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Select Your Seats
            <Badge variant="outline" className="ml-auto">
              {selectedSeats.length}/{maxSeats} selected
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Bus Layout</h3>
                  <div className="text-sm text-muted-foreground">Front</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Driver Area */}
                <div className="flex justify-end mb-4">
                  <div className="w-12 h-6 bg-gray-200 rounded-sm flex items-center justify-center text-xs">
                    Driver
                  </div>
                </div>
                
                {/* Seat Rows */}
                {Object.entries(seatsByRow).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center justify-center gap-2">
                    <div className="w-6 text-xs text-muted-foreground text-center">{row}</div>
                    <div className="flex gap-1">
                      {rowSeats.slice(0, 2).map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeatSelection(seat.id)}
                          className={getSeatClass(seat)}
                          disabled={!seat.isAvailable}
                          title={`Seat ${seat.code} - ${seat.type} (${seat.isAvailable ? 'Available' : 'Occupied'})`}
                        >
                          {selectedSeats.some(s => s.id === seat.id) ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            seat.code.slice(-1)
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="w-8"></div> {/* Aisle */}
                    <div className="flex gap-1">
                      {rowSeats.slice(2, 4).map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeatSelection(seat.id)}
                          className={getSeatClass(seat)}
                          disabled={!seat.isAvailable}
                          title={`Seat ${seat.code} - ${seat.type} (${seat.isAvailable ? 'Available' : 'Occupied'})`}
                        >
                          {selectedSeats.some(s => s.id === seat.id) ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            seat.code.slice(-1)
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
                <span>Normal {formatCurrency(150000)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-50 border-2 border-purple-300 rounded"></div>
                <span>VIP {formatCurrency(250000)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
                <span>Business {formatCurrency(350000)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
                <span>Occupied</span>
              </div>
            </div>
          </div>
          
          {/* Selection Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">Selection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSeats.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Seats:</h4>
                      {selectedSeats.map((seat) => (
                        <div key={seat.id} className="flex justify-between items-center text-sm">
                          <span>
                            Seat {seat.code}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {seat.type === 'normal' ? 'Normal' : seat.type === 'vip' ? 'VIP' : 'Business'}
                            </Badge>
                          </span>
                          <span className="font-medium">
                            {seat.price.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total:</span>
                        <span className="text-primary">
                          {formatCurrency(getTotalPrice())}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleConfirm}
                      className="w-full"
                      size="lg"
                    >
                      Continue with {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Select up to {maxSeats} seat{maxSeats > 1 ? 's' : ''} to continue
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}