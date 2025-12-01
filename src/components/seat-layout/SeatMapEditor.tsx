"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SeatInfo, SeatLayoutConfig, SeatPricingConfig, SeatLayoutType } from '@/services/seat-layout.service';
import { Trash2, Plus, Save, RotateCcw, Move } from 'lucide-react';

interface SeatMapEditorProps {
  layoutConfig: SeatLayoutConfig;
  pricingConfig: SeatPricingConfig;
  onLayoutChange: (config: SeatLayoutConfig) => void;
  onPricingChange: (config: SeatPricingConfig) => void;
  readonly?: boolean;
}

export default function SeatMapEditor({
  layoutConfig,
  pricingConfig,
  onLayoutChange,
  onPricingChange,
  readonly = false,
}: SeatMapEditorProps) {
  const [selectedSeat, setSelectedSeat] = useState<SeatInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedSeat, setDraggedSeat] = useState<SeatInfo | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const getSeatColor = (seat: SeatInfo) => {
    if (!seat.isAvailable) return 'bg-gray-400';
    switch (seat.type) {
      case 'vip':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'business':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-green-500 hover:bg-green-600';
    }
  };

  const getSeatBorderColor = (seat: SeatInfo) => {
    if (selectedSeat?.id === seat.id) return 'border-yellow-400 border-4';
    return 'border-gray-300 border-2';
  };

  const handleSeatClick = (seat: SeatInfo) => {
    if (readonly) return;
    setSelectedSeat(seat);
  };

  const handleMouseDown = (e: React.MouseEvent, seat: SeatInfo) => {
    if (readonly) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDraggedSeat(seat);
    setDragOffset({
      x: e.clientX - rect.left - seat.position.x,
      y: e.clientY - rect.top - seat.position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedSeat || !canvasRef.current || readonly) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, layoutConfig.dimensions.totalWidth - draggedSeat.position.width));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, layoutConfig.dimensions.totalHeight - draggedSeat.position.height));

      const updatedSeats = layoutConfig.seats.map(seat =>
        seat.id === draggedSeat.id
          ? {
              ...seat,
              position: {
                ...seat.position,
                x: newX,
                y: newY,
              },
            }
          : seat
      );

      onLayoutChange({
        ...layoutConfig,
        seats: updatedSeats,
      });
    },
    [isDragging, draggedSeat, dragOffset, layoutConfig, onLayoutChange, readonly]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedSeat(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const updateSeatType = (seatId: string, type: 'normal' | 'vip' | 'business') => {
    const updatedSeats = layoutConfig.seats.map(seat =>
      seat.id === seatId ? { ...seat, type } : seat
    );
    onLayoutChange({
      ...layoutConfig,
      seats: updatedSeats,
    });
  };

  const updateSeatAvailability = (seatId: string, isAvailable: boolean) => {
    const updatedSeats = layoutConfig.seats.map(seat =>
      seat.id === seatId ? { ...seat, isAvailable } : seat
    );
    onLayoutChange({
      ...layoutConfig,
      seats: updatedSeats,
    });
  };

  const resetLayout = () => {
    // This would reset to the original template layout
    // Implementation depends on how you want to handle reset
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {/* Seat Map Canvas */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Seat Map Layout
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetLayout}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                {readonly ? 'Viewing seat layout' : 'Click seats to select, drag to reposition'}
              </div>
              
              <div
                ref={canvasRef}
                className="relative bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden"
                style={{
                  width: `${layoutConfig.dimensions.totalWidth}px`,
                  height: `${layoutConfig.dimensions.totalHeight}px`,
                  minWidth: '400px',
                  minHeight: '300px',
                }}
              >
                {/* Draw aisles */}
                {layoutConfig.aisles.map((aisle, index) => (
                  <div
                    key={`aisle-${index}`}
                    className="absolute bg-gray-300"
                    style={{
                      left: `${aisle * (layoutConfig.dimensions.seatWidth + layoutConfig.dimensions.aisleWidth)}px`,
                      top: 0,
                      width: `${layoutConfig.dimensions.aisleWidth}px`,
                      height: '100%',
                    }}
                  />
                ))}

                {/* Draw seats */}
                {layoutConfig.seats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`absolute cursor-pointer transition-all duration-200 rounded flex items-center justify-center text-white font-semibold text-xs ${getSeatColor(
                      seat
                    )} ${getSeatBorderColor(seat)}`}
                    style={{
                      left: `${seat.position.x}px`,
                      top: `${seat.position.y}px`,
                      width: `${seat.position.width}px`,
                      height: `${seat.position.height}px`,
                    }}
                    onClick={() => handleSeatClick(seat)}
                    onMouseDown={(e) => handleMouseDown(e, seat)}
                    title={`${seat.code} - ${seat.type} ${!seat.isAvailable ? '(Unavailable)' : ''}`}
                  >
                    {seat.code}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>VIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Business</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span>Unavailable</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seat Properties Panel */}
        <div className="space-y-6 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Seat Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSeat ? (
                <>
                  <div>
                    <Label>Seat Code</Label>
                    <p className="font-semibold">{selectedSeat.code}</p>
                  </div>

                  <div>
                    <Label>Seat Type</Label>
                    <Select
                      value={selectedSeat.type}
                      onValueChange={(value: 'normal' | 'vip' | 'business') =>
                        updateSeatType(selectedSeat.id, value)
                      }
                      disabled={readonly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Availability</Label>
                    <Select
                      value={selectedSeat.isAvailable ? 'true' : 'false'}
                      onValueChange={(value: string) =>
                        updateSeatAvailability(selectedSeat.id, value === 'true')
                      }
                      disabled={readonly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Available</SelectItem>
                        <SelectItem value="false">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div>
                    <Label>Position</Label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Row:</span> {selectedSeat.position.row}
                      </div>
                      <div>
                        <span className="text-gray-600">Position:</span> {selectedSeat.position.position}
                      </div>
                      <div>
                        <span className="text-gray-600">X:</span> {Math.round(selectedSeat.position.x)}px
                      </div>
                      <div>
                        <span className="text-gray-600">Y:</span> {Math.round(selectedSeat.position.y)}px
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Select a seat to view properties</p>
              )}
            </CardContent>
          </Card>

          {/* Pricing Configuration */}
          <div className="space-y-6 w-full">

            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Base Price</Label>
                  <Input
                    type="number"
                    value={pricingConfig.basePrice}
                    onChange={(e) =>
                      onPricingChange({
                        ...pricingConfig,
                        basePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={readonly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Seat Type Prices</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">Normal</Label>
                      <Input
                        type="number"
                        value={pricingConfig.seatTypePrices.normal}
                        onChange={(e) =>
                          onPricingChange({
                            ...pricingConfig,
                            seatTypePrices: {
                              ...pricingConfig.seatTypePrices,
                              normal: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={readonly}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">VIP</Label>
                      <Input
                        type="number"
                        value={pricingConfig.seatTypePrices.vip}
                        onChange={(e) =>
                          onPricingChange({
                            ...pricingConfig,
                            seatTypePrices: {
                              ...pricingConfig.seatTypePrices,
                              vip: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={readonly}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Business</Label>
                      <Input
                        type="number"
                        value={pricingConfig.seatTypePrices.business}
                        onChange={(e) =>
                          onPricingChange({
                            ...pricingConfig,
                            seatTypePrices: {
                              ...pricingConfig.seatTypePrices,
                              business: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={readonly}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Layout Statistics */}
          <div className="space-y-6 w-full">

            <Card>
              <CardHeader>
                <CardTitle>Layout Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Seats:</span>
                  <span className="font-semibold">{layoutConfig.seats.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Available:</span>
                  <span className="font-semibold text-green-600">
                    {layoutConfig.seats.filter(s => s.isAvailable).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unavailable:</span>
                  <span className="font-semibold text-red-600">
                    {layoutConfig.seats.filter(s => !s.isAvailable).length}
                  </span>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-600">Normal:</span> {layoutConfig.seats.filter(s => s.type === 'normal').length}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">VIP:</span> {layoutConfig.seats.filter(s => s.type === 'vip').length}
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Business:</span> {layoutConfig.seats.filter(s => s.type === 'business').length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
