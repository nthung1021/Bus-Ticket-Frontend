"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeatInfo, SeatLayoutConfig } from '@/services/seat-layout.service';
import { Armchair, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeatSelectionMapProps {
    layoutConfig: SeatLayoutConfig;
    bookedSeats?: string[]; // Array of seat IDs that are already booked
    onSelectionChange?: (selectedSeats: SeatInfo[]) => void;
    maxSeats?: number;
    className?: string;
}

type SeatStatus = 'available' | 'selected' | 'booked' | 'unavailable';

export default function SeatSelectionMap({
    layoutConfig,
    bookedSeats = [],
    onSelectionChange,
    maxSeats = 10,
    className,
}: SeatSelectionMapProps) {
    const [selectedSeats, setSelectedSeats] = useState<SeatInfo[]>([]);
    const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

    // Group seats by row for rendering
    const seatsByRow: Record<number, SeatInfo[]> = {};
    if (layoutConfig?.seats) {
        layoutConfig.seats.forEach(seat => {
            const row = seat.position.row;
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push(seat);
        });

        // Sort seats within each row by position
        Object.keys(seatsByRow).forEach(row => {
            seatsByRow[Number(row)].sort((a, b) => a.position.position - b.position.position);
        });
    }

    const getSeatStatus = (seat: SeatInfo): SeatStatus => {
        if (!seat.isAvailable) return 'unavailable';
        if (bookedSeats.includes(seat.id)) return 'booked';
        if (selectedSeats.some(s => s.id === seat.id)) return 'selected';
        return 'available';
    };

    const handleSeatClick = (seat: SeatInfo) => {
        const status = getSeatStatus(seat);

        // Can't select booked or unavailable seats
        if (status === 'booked' || status === 'unavailable') {
            return;
        }

        let newSelectedSeats: SeatInfo[];

        if (status === 'selected') {
            // Deselect the seat
            newSelectedSeats = selectedSeats.filter(s => s.id !== seat.id);
        } else {
            // Select the seat (if under max limit)
            if (selectedSeats.length >= maxSeats) {
                return; // Max seats reached
            }
            newSelectedSeats = [...selectedSeats, seat];
        }

        setSelectedSeats(newSelectedSeats);
        onSelectionChange?.(newSelectedSeats);
    };

    const getSeatClassName = (seat: SeatInfo) => {
        const status = getSeatStatus(seat);
        const isHovered = hoveredSeat === seat.id;

        const baseClasses = "relative w-12 h-12 rounded-lg transition-all duration-200 flex items-center justify-center text-xs font-semibold cursor-pointer group";

        const statusClasses = {
            available: cn(
                "bg-gradient-to-br border-2 hover:scale-110 hover:shadow-lg",
                seat.type === 'vip' && "from-purple-50 to-purple-100 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 dark:border-purple-600 dark:text-purple-300",
                seat.type === 'business' && "from-blue-50 to-blue-100 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 dark:border-blue-600 dark:text-blue-300",
                seat.type === 'normal' && "from-green-50 to-green-100 border-green-300 text-green-700 hover:from-green-100 hover:to-green-200 dark:from-green-900/30 dark:to-green-800/30 dark:border-green-600 dark:text-green-300"
            ),
            selected: "bg-gradient-to-br from-primary/90 to-primary border-2 border-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/30",
            booked: "bg-muted/50 border-2 border-muted text-muted-foreground cursor-not-allowed opacity-60",
            unavailable: "bg-muted/30 border-2 border-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-40",
        };

        return cn(baseClasses, statusClasses[status], isHovered && status === 'available' && "ring-2 ring-primary/50");
    };

    const getSeatIcon = (status: SeatStatus) => {
        if (status === 'selected') {
            return <Check className="w-4 h-4 absolute top-0.5 right-0.5" />;
        }
        if (status === 'booked') {
            return <X className="w-3 h-3 absolute top-0.5 right-0.5 opacity-50" />;
        }
        return null;
    };

    const getTotalPrice = () => {
        return selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0);
    };

    const clearSelection = () => {
        setSelectedSeats([]);
        onSelectionChange?.([]);
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Legend */}
            <Card className="bg-gradient-to-br from-card to-card/80 border border-border rounded-2xl p-6">
                <div className="flex flex-wrap gap-4 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 dark:from-green-900/30 dark:to-green-800/30 dark:border-green-600"></div>
                        <span className="text-sm font-medium">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 dark:from-purple-900/30 dark:to-purple-800/30 dark:border-purple-600"></div>
                        <span className="text-sm font-medium">VIP</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 dark:from-blue-900/30 dark:to-blue-800/30 dark:border-blue-600"></div>
                        <span className="text-sm font-medium">Business</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/90 to-primary border-2 border-primary"></div>
                        <span className="text-sm font-medium">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 border-2 border-muted opacity-60"></div>
                        <span className="text-sm font-medium">Booked</span>
                    </div>
                </div>
            </Card>

            {/* Seat Map */}
            <Card className="bg-gradient-to-br from-card to-card/80 border border-border rounded-2xl p-8">
                <div className="space-y-6">
                    {/* Driver Section */}
                    <div className="flex justify-start mb-8">
                        <div className="bg-gradient-to-br from-muted/50 to-muted/30 border-2 border-muted rounded-xl px-6 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-muted-foreground">Driver</span>
                        </div>
                    </div>

                    {/* Seats Grid */}
                    <div className="flex flex-col items-center gap-4">
                        {Object.entries(seatsByRow)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([rowNum, seats]) => (
                                <div key={`row-${rowNum}`} className="flex items-center gap-4">
                                    {/* Row Label */}
                                    <div className="w-12 text-center">
                                        <Badge variant="outline" className="font-semibold">
                                            {rowNum}
                                        </Badge>
                                    </div>

                                    {/* Seats in Row */}
                                    <div className="flex gap-3">
                                        {seats.map((seat, index) => {
                                            const status = getSeatStatus(seat);
                                            const isAisle = layoutConfig.aisles?.includes(index);

                                            return (
                                                <React.Fragment key={seat.id}>
                                                    {isAisle && <div className="w-8" />}
                                                    <div
                                                        className={getSeatClassName(seat)}
                                                        onClick={() => handleSeatClick(seat)}
                                                        onMouseEnter={() => setHoveredSeat(seat.id)}
                                                        onMouseLeave={() => setHoveredSeat(null)}
                                                        title={`${seat.code} - ${seat.type.toUpperCase()} - ${status.toUpperCase()}${seat.price ? ` - ${seat.price.toLocaleString('vi-VN')} VNĐ` : ''}`}
                                                    >
                                                        <Armchair className="w-5 h-5" />
                                                        {getSeatIcon(status)}

                                                        {/* Tooltip on hover */}
                                                        {hoveredSeat === seat.id && status === 'available' && (
                                                            <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap text-xs font-medium">
                                                                <div className="font-bold">{seat.code}</div>
                                                                <div className="text-muted-foreground capitalize">{seat.type}</div>
                                                                {seat.price && (
                                                                    <div className="text-primary font-semibold">
                                                                        {seat.price.toLocaleString('vi-VN')} VNĐ
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </Card>

            {/* Selection Summary */}
            {selectedSeats.length > 0 && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-h6 font-semibold flex items-center gap-2">
                                <Check className="w-5 h-5 text-primary" />
                                Selected Seats ({selectedSeats.length}/{maxSeats})
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                Clear All
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {selectedSeats.map(seat => (
                                <Badge
                                    key={seat.id}
                                    variant="secondary"
                                    className="px-3 py-1.5 text-sm font-semibold bg-primary/10 text-primary border border-primary/30 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                                    onClick={() => handleSeatClick(seat)}
                                >
                                    {seat.code}
                                    <X className="w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                            <span className="text-body font-medium">Total Price:</span>
                            <span className="text-h5 font-bold text-primary">
                                {getTotalPrice().toLocaleString('vi-VN')} VNĐ
                            </span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
