"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Armchair, Users, RotateCcw } from "lucide-react";
import { getSeatLayout, SeatLayoutConfig } from "@/services/seat-layout.service";
import { getSeatStatusForTrip } from "@/services/seat-status.service";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Passenger {
  id: string;
  fullName: string;
  seatCode: string;
}

interface SeatSelectionForEditProps {
  tripId: string;
  busId: string;
  currentSeats: string[];
  passengers: Passenger[];
  onSeatChange: (passengerId: string, oldSeatCode: string, newSeatCode: string) => void;
  disabled?: boolean;
}

interface SeatStatus {
  seatCode: string;
  state: 'available' | 'booked' | 'locked';
  lockedUntil?: string;
}

export function SeatSelectionForEdit({ 
  tripId, 
  busId, 
  currentSeats, 
  passengers,
  onSeatChange,
  disabled = false
}: SeatSelectionForEditProps) {
  const [seatLayout, setSeatLayout] = useState<SeatLayoutConfig | null>(null);
  const [seatStatuses, setSeatStatuses] = useState<SeatStatus[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<string | null>(null);
  const [newSeatSelections, setNewSeatSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeatData();
  }, [tripId, busId]);

  const loadSeatData = async () => {
    try {
      setLoading(true);
      const [layoutResponse, statusResponse] = await Promise.all([
        getSeatLayout(busId),
        getSeatStatusForTrip(tripId)
      ]);
      
      setSeatLayout(layoutResponse.data);
      setSeatStatuses(statusResponse.data);
    } catch (error) {
      console.error('Error loading seat data:', error);
      toast.error('Failed to load seat information');
    } finally {
      setLoading(false);
    }
  };

  const getSeatState = (seatCode: string) => {
    // Check if it's currently selected by this booking
    if (currentSeats.includes(seatCode)) {
      return 'current';
    }
    
    // Check if it's a new selection for a passenger
    const newSelection = Object.values(newSeatSelections).includes(seatCode);
    if (newSelection) {
      return 'new-selection';
    }
    
    // Check seat status from backend
    const status = seatStatuses.find(s => s.seatCode === seatCode);
    if (status?.state === 'booked') {
      return 'booked';
    }
    if (status?.state === 'locked') {
      return 'locked';
    }
    
    return 'available';
  };

  const handleSeatClick = (seatCode: string) => {
    if (disabled) {
      toast.error('Seat selection is currently disabled');
      return;
    }

    if (!selectedPassenger) {
      toast.error('Please select a passenger first');
      return;
    }

    const seatState = getSeatState(seatCode);
    
    // Can't select booked or locked seats (except current ones)
    if (seatState === 'booked' || seatState === 'locked') {
      toast.error('This seat is not available');
      return;
    }

    // If clicking on current seat, do nothing
    if (seatState === 'current') {
      const passenger = passengers.find(p => p.id === selectedPassenger);
      if (passenger && passenger.seatCode === seatCode) {
        toast.info('This is the passenger\'s current seat');
        return;
      }
    }

    // Set new seat selection
    const passenger = passengers.find(p => p.id === selectedPassenger);
    if (passenger) {
      const oldSeatCode = passenger.seatCode;
      
      setNewSeatSelections(prev => ({
        ...prev,
        [selectedPassenger]: seatCode
      }));
      
      onSeatChange(selectedPassenger, oldSeatCode, seatCode);
      toast.success(`Seat ${seatCode} selected for ${passenger.fullName}`);
    }
  };

  const resetPassengerSeat = (passengerId: string) => {
    setNewSeatSelections(prev => {
      const updated = { ...prev };
      delete updated[passengerId];
      return updated;
    });
    
    const passenger = passengers.find(p => p.id === passengerId);
    if (passenger) {
      onSeatChange(passengerId, passenger.seatCode, passenger.seatCode);
      toast.info(`Reset seat selection for ${passenger.fullName}`);
    }
  };

  const renderSeat = (seatCode: string) => {
    const seatState = getSeatState(seatCode);
    
    return (
      <button
        key={seatCode}
        onClick={() => handleSeatClick(seatCode)}
        className={cn(
          "w-8 h-8 rounded-md border-2 flex items-center justify-center text-xs font-medium transition-all hover:scale-110",
          {
            // Current seats (blue)
            "bg-blue-100 border-blue-500 text-blue-700": seatState === 'current',
            // New selections (green)
            "bg-green-100 border-green-500 text-green-700": seatState === 'new-selection',
            // Available seats (white)
            "bg-white border-gray-300 text-gray-700 hover:bg-gray-50": seatState === 'available',
            // Booked seats (red)
            "bg-red-100 border-red-500 text-red-700 cursor-not-allowed": seatState === 'booked',
            // Locked seats (yellow)
            "bg-yellow-100 border-yellow-500 text-yellow-700 cursor-not-allowed": seatState === 'locked',
          }
        )}
        disabled={seatState === 'booked' || seatState === 'locked'}
      >
        <Armchair className="w-3 h-3" />
      </button>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading seats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!seatLayout) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Failed to load seat layout</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Seat Selection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Passenger Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Select passenger to change seat:</p>
          <div className="space-y-2">
            {passengers.map(passenger => {
              const hasNewSeat = newSeatSelections[passenger.id];
              
              return (
                <div key={passenger.id} className="flex items-center gap-3 p-2 border rounded">
                  <input
                    type="radio"
                    id={`passenger-${passenger.id}`}
                    name="selectedPassenger"
                    checked={selectedPassenger === passenger.id}
                    onChange={() => setSelectedPassenger(passenger.id)}
                    className="w-4 h-4"
                  />
                  <label 
                    htmlFor={`passenger-${passenger.id}`}
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {passenger.fullName}
                  </label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {hasNewSeat ? newSeatSelections[passenger.id] : passenger.seatCode}
                    </Badge>
                    {hasNewSeat && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resetPassengerSeat(passenger.id)}
                        className="h-6 w-6 p-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seat Map */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
              <span>New Selection</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
              <span>Booked</span>
            </div>
          </div>
          
          {/* Driver area */}
          <div className="text-center text-xs text-muted-foreground mb-4 border-b pb-2">
            🚗 Driver
          </div>
          
          {/* Seat grid */}
          <div className="space-y-2">
            {seatLayout.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center justify-center gap-1">
                {/* Left seats */}
                <div className="flex gap-1">
                  {row.leftSeats?.map(seatCode => renderSeat(seatCode))}
                </div>
                
                {/* Aisle */}
                <div className="w-4 text-center text-xs text-muted-foreground">
                  {rowIndex + 1}
                </div>
                
                {/* Right seats */}
                <div className="flex gap-1">
                  {row.rightSeats?.map(seatCode => renderSeat(seatCode))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 Select a passenger first, then click on an available seat to change.</p>
          <p>⚠️ Seat changes may affect the total booking price.</p>
          <p>🔄 Changes are saved automatically when you confirm.</p>
        </div>
      </CardContent>
    </Card>
  );
}