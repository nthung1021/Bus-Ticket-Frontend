"use client";

/**
 * SeatSelectionMap Component
 * 
 * A interactive seat selection map for bus ticket booking with real-time updates.
 * 
 * Features:
 * - Visual seat map with different seat types (Normal, VIP, Business)
 * - Real-time seat locking to prevent double booking
 * - Price calculation based on seat type
 * - Selection management with limits
 * - Responsive design with hover effects
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeatInfo, SeatLayoutConfig, SeatPricingConfig } from '@/services/seat-layout.service';
import { Armchair, X, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSeatWebSocket } from '@/hooks/useSeatWebSocket';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';

/**
 * Props for SeatSelectionMap component
 */
interface SeatSelectionMapProps {
    /** Layout configuration containing seat positions and aisles */
    layoutConfig: SeatLayoutConfig;
    /** Pricing configuration for different seat types (fallback if seat has no individual price) */
    seatPricing?: SeatPricingConfig;
    /** Array of seat IDs that are already booked/unavailable */
    bookedSeats?: string[];
    /** Callback function called when seat selection changes */
    onSelectionChange?: (selectedSeats: SeatInfo[]) => void;
    /** Maximum number of seats that can be selected (default: 10) */
    maxSeats?: number;
    /** Additional CSS classes for styling */
    className?: string;
    /** Trip ID required for WebSocket real-time connection */
    tripId: string;
    /** Enable/disable real-time seat locking features (default: true) */
    enableRealtime?: boolean;
}

/**
 * Possible states for a seat in the selection map
 */
type SeatStatus = 'available' | 'selected' | 'booked' | 'unavailable' | 'locked';

function SeatSelectionMap({
    layoutConfig,
    seatPricing,
    onSelectionChange,
    maxSeats = 10,
    className,
    tripId,
    enableRealtime = true,
}: SeatSelectionMapProps) {
    /** Currently selected seats by the user */
    const [selectedSeats, setSelectedSeats] = useState<SeatInfo[]>([]);
    /** Seat currently being hovered for tooltip display */
    const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

    /**
     * WebSocket integration for real-time seat locking
     * Prevents multiple users from selecting the same seat simultaneously
     */
    const {
        isConnected,          // WebSocket connection status
        lockedSeats,         // Seats currently locked by other users
        bookedSeats,
        lockSeat,           // Function to lock a seat
        unlockSeat,         // Function to unlock a seat
        isSeatLockedByOthers, // Check if seat is locked by someone else
        isSeatLockedByMe,   // Check if seat is locked by current user
    } = useSeatWebSocket({
        tripId,
        enabled: enableRealtime,
    });
    
    useEffect(() => {
        console.log("useEffect triggered - Booked seats:", bookedSeats);
        console.log("Booked seats size:", bookedSeats.size);
        console.log("Booked seats array:", Array.from(bookedSeats));
    }, [bookedSeats]);
    /**
     * Group seats by row number for organized rendering
     * Creates a structure like: { 1: [seat1, seat2], 2: [seat3, seat4], ... }
     */ 
    const seatsByRow: Record<number, SeatInfo[]> = {};
    // console.log(layoutConfig)
    if (layoutConfig?.seats) {
        layoutConfig.seats.forEach(seat => {
            const row = seat.position.row;
            if (!seatsByRow[row]) {
                seatsByRow[row] = [];
            }
            seatsByRow[row].push(seat);
        });

        /**
         * Sort seats within each row by position number
         * Ensures seats appear in correct order left-to-right
         */
        Object.keys(seatsByRow).forEach(row => {
            seatsByRow[Number(row)].sort((a, b) => a.position.position - b.position.position);
        });
    }
    // console.log(seatsByRow);
    /**
     * Determines the current status of a seat based on various conditions
     * @param seat - The seat to check
     * @returns The current status of the seat
     */
    const getSeatStatus = (seat: SeatInfo): SeatStatus => {
        if (!seat.isAvailable) return 'unavailable';           // Seat is permanently unavailable
        if (bookedSeats.has(seat.id)) return 'booked';   // Seat is already booked
        if (selectedSeats.some(s => s.id === seat.id)) return 'selected'; // Seat is selected by current user
        if (enableRealtime && isSeatLockedByOthers(seat.id)) return 'locked'; // Seat is locked by another user
        return 'available';                                    // Seat is available for selection
    };

    /**
     * Handles seat selection/deselection with real-time locking
     * @param seat - The seat that was clicked
     */
    const handleSeatClick = async (seat: SeatInfo) => {
        const status = getSeatStatus(seat);

        // Prevent interaction with unavailable seats
        if (status === 'booked' || status === 'unavailable' || status === 'locked') {
            if (status === 'locked') {
                toast.error('This seat is currently being selected by another user');
            }
            return;
        }

        let newSelectedSeats: SeatInfo[];

        if (status === 'selected') {
            /** Deselect the seat and unlock it for other users */
            if (enableRealtime) {
                await unlockSeat(seat.id);
            }
            newSelectedSeats = selectedSeats.filter(s => s.id !== seat.id);
        } else {
            /** Select the seat if under the maximum limit */
            if (selectedSeats.length >= maxSeats) {
                toast.error(`Maximum ${maxSeats} seats can be selected`);
                return;
            }

            /** Attempt to lock the seat to prevent double selection */
            if (enableRealtime) {
                const locked = await lockSeat(seat.id);
                if (!locked) {
                    toast.error('Failed to lock seat. It may have been selected by another user.');
                    return;
                }
            }

            newSelectedSeats = [...selectedSeats, seat];
        }

        /** Update local state and notify parent component */
        setSelectedSeats(newSelectedSeats);
        onSelectionChange?.(newSelectedSeats);
    };

    /**
     * Generates CSS classes for seat styling based on status and type
     * @param seat - The seat to style
     * @returns Combined CSS class names
     */
    const getSeatClassName = (seat: SeatInfo) => {
        const status = getSeatStatus(seat);
        const isHovered = hoveredSeat === seat.id;

        /** Base styling for all seats */
        const baseClasses = "relative w-12 h-12 rounded-lg transition-all duration-200 flex items-center justify-center text-xs font-semibold cursor-pointer group";

        /** Status-specific styling */
        const statusClasses = {
            /** Available seats - colored by type with hover effects */
            available: cn(
                "bg-gradient-to-br border-2 hover:scale-110 hover:shadow-lg",
                seat.type === 'vip' && "from-purple-50 to-purple-100 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 dark:border-purple-600 dark:text-purple-300",
                seat.type === 'business' && "from-blue-50 to-blue-100 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 dark:border-blue-600 dark:text-blue-300",
                seat.type === 'normal' && "from-green-50 to-green-100 border-green-300 text-green-700 hover:from-green-100 hover:to-green-200 dark:from-green-900/30 dark:to-green-800/30 dark:border-green-600 dark:text-green-300"
            ),
            /** Selected seats - highlighted with primary color */
            selected: "bg-gradient-to-br from-primary/90 to-primary border-2 border-primary text-primary-foreground scale-105 shadow-lg ring-2 ring-primary/30",
            /** Booked seats - grayed out and disabled */
            booked: "bg-muted/50 border-2 border-muted text-muted-foreground cursor-not-allowed opacity-60",
            /** Unavailable seats - very faint and disabled */
            unavailable: "bg-muted/30 border-2 border-muted/50 text-muted-foreground/50 cursor-not-allowed opacity-40",
            /** Locked seats - orange tint to show temporary unavailability */
            locked: "bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 text-orange-700 cursor-not-allowed opacity-70 dark:from-orange-900/30 dark:to-orange-800/30 dark:border-orange-600 dark:text-orange-300",
        };

        return cn(baseClasses, statusClasses[status], isHovered && status === 'available' && "ring-2 ring-primary/50");
    };

    /**
     * Returns the appropriate icon for a seat based on its status
     * @param status - The seat status
     * @returns Icon component or null
     */
    const getSeatIcon = (status: SeatStatus) => {
        if (status === 'selected') {
            return <Check className="w-4 h-4 absolute top-0.5 right-0.5" />;
        }
        if (status === 'booked') {
            return <X className="w-3 h-3 absolute top-0.5 right-0.5 opacity-50" />;
        }
        if (status === 'locked') {
            return <Lock className="w-3 h-3 absolute top-0.5 right-0.5" />;
        }
        return null;
    };

    /**
     * Calculates the price for a specific seat
     * Uses individual seat price if available, otherwise falls back to seat type pricing
     * @param seat - The seat to price
     * @returns Price in VND
     */
    const getSeatPrice = (seat: SeatInfo): number => {
        return seat.price || (seatPricing?.seatTypePrices[seat.type] ?? 0);
    };

    /**
     * Calculates the total price for all selected seats
     * @returns Total price in VND
     */
    const getTotalPrice = () => {
        return selectedSeats.reduce((total, seat) => total + getSeatPrice(seat), 0);
    };

    /**
     * Clears all seat selections and resets the selection state
     */
    const clearSelection = () => {
        setSelectedSeats([]);
        onSelectionChange?.([]);
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* WebSocket Connection Status Indicator */}
            {enableRealtime && (
                <div className="flex items-center justify-center gap-2 text-sm">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    )} />
                    <span className="text-muted-foreground">
                        {isConnected ? 'Real-time updates active' : 'Connecting...'}
                    </span>
                </div>
            )}

            {/* Seat Type Legend */}
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
                    {enableRealtime && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 opacity-70 dark:from-orange-900/30 dark:to-orange-800/30 dark:border-orange-600"></div>
                            <span className="text-sm font-medium">Locked by Others</span>
                        </div>
                    )}
                </div>
            </Card>

            {/* Interactive Seat Map */}
            <Card className="bg-gradient-to-br from-card to-card/80 border border-border rounded-2xl p-8">
                <div className="space-y-6">
                    {/* Driver Position Indicator */}
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

                    {/* Seats Arranged by Rows */}
                    <div className="flex flex-col items-center gap-4">
                        {Object.entries(seatsByRow)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([rowNum, seats]) => (
                                <div key={`row-${rowNum}`} className="flex items-center gap-4">
                                    {/* Row Number Badge */}
                                    <div className="w-12 text-center">
                                        <Badge variant="outline" className="font-semibold">
                                            {rowNum}
                                        </Badge>
                                    </div>

                                    {/* Individual Seats in Row */}
                                    <div className="flex gap-3">
                                        {seats.map((seat, index) => {
                                            const status = getSeatStatus(seat);
                                            const isAisle = layoutConfig.aisles?.includes(index);

                                            return (
                                                <React.Fragment key={seat.id}>
                                                    {/* Aisle spacing between seat groups */}
                                                    {isAisle && <div className="w-8" />}
                                                    <div
                                                        className={getSeatClassName(seat)}
                                                        onClick={() => handleSeatClick(seat)}
                                                        onMouseEnter={() => setHoveredSeat(seat.id)}
                                                        onMouseLeave={() => setHoveredSeat(null)}
                                                        title={`${seat.code} - ${seat.type.toUpperCase()} - ${status.toUpperCase()} - ${formatCurrency(getSeatPrice(seat))}`}
                                                    >
                                                        <Armchair className="w-5 h-5" />
                                                        {getSeatIcon(status)}

                                                        {/* Hover Tooltip with seat details */}
                                                        {hoveredSeat === seat.id && status === 'available' && (
                                                            <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border border-border whitespace-nowrap text-xs font-medium">
                                                                <div className="font-bold">{seat.code}</div>
                                                                <div className="text-muted-foreground capitalize">{seat.type}</div>
                                                                <div className="text-primary font-semibold">
                                                                    {formatCurrency(getSeatPrice(seat))}
                                                                </div>
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

            {/* Selection Summary Panel - Shows when seats are selected */}
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

                        {/* Selected Seat Badges - Clickable to remove */}
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

                        {/* Total Price Display */}
                        <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                            <span className="text-body font-medium">Total Price:</span>
                            <span className="text-h5 font-bold text-primary">
                                {formatCurrency(getTotalPrice())}
                            </span>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

/**
 * Export the component for use in other parts of the application
 */
export default SeatSelectionMap;
