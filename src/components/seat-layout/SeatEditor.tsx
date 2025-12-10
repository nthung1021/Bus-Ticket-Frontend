"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { SeatInfo, SeatLayoutConfig, SeatPricingConfig, SeatLayoutType } from '@/services/seat-layout.service';
import { RotateCcw, Plus, Trash2 } from 'lucide-react';

interface SeatEditorProps {
  layoutConfig: SeatLayoutConfig;
  onLayoutChange: (config: SeatLayoutConfig) => void;
  readonly?: boolean;
  pricingConfig?: SeatPricingConfig;
  onPricingChange?: (config: SeatPricingConfig) => void;
  onLayoutTypeChange?: (type: SeatLayoutType) => void;
}

export default function SeatEditor({ 
  layoutConfig, 
  onLayoutChange,
  readonly = false,
  pricingConfig,
  onPricingChange,
  onLayoutTypeChange
}: SeatEditorProps) {
  // Group seats by row
  const seatsByRow: Record<number, SeatInfo[]> = {};
  if (layoutConfig?.seats) {
    layoutConfig.seats.forEach(seat => {
      const row = seat.position.row;
      if (!seatsByRow[row]) {
        seatsByRow[row] = [];
      }
      seatsByRow[row].push(seat);
    });
  }

  const handleSeatTypeChange = (seatId: string, type: 'normal' | 'vip' | 'business') => {
    if (!layoutConfig?.seats) return;
    const updatedSeats = layoutConfig.seats.map(seat =>
      seat.id === seatId ? { ...seat, type } : seat
    );
    if (layoutConfig) {
      onLayoutChange({ ...layoutConfig, seats: updatedSeats });
    }
  };

  const markAsCustom = () => {
    // Notify parent component that layout should be marked as CUSTOM
    onLayoutTypeChange?.(SeatLayoutType.CUSTOM);
  };

  const toggleSeatAvailability = (seatId: string) => {
    if (!layoutConfig?.seats) return;
    const updatedSeats = layoutConfig.seats.map(seat =>
      seat.id === seatId ? { ...seat, isAvailable: !seat.isAvailable } : seat
    );
    if (layoutConfig) {
      onLayoutChange({ ...layoutConfig, seats: updatedSeats });
    }
  };

  const resetLayout = () => {
    if (!layoutConfig?.seats) return;
    const resetSeats = layoutConfig.seats.map(seat => ({
      ...seat,
      isAvailable: true,
      type: 'normal' as const,
    }));
    if (layoutConfig) {
      onLayoutChange({ ...layoutConfig, seats: resetSeats });
    }
  };

  const addRow = () => {
    if (!layoutConfig?.seats) return;
    markAsCustom(); // Mark as CUSTOM when modifying structure
    
    const rows = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);
    const newRow = rows.length > 0 ? Math.max(...rows) + 1 : 1;
    const seatsInRow = rows.length > 0 ? seatsByRow[rows[0]]?.length || 0 : 4;
    
    const newSeats: SeatInfo[] = [];
    for (let i = 0; i < seatsInRow; i++) {
      const seatId = crypto.randomUUID(); // Generate proper UUID
      newSeats.push({
        id: seatId,
        code: `${newRow}${String.fromCharCode(65 + i)}`,
        type: 'normal',
        position: {
          row: newRow,
          position: i + 1,
          x: i * (layoutConfig.dimensions.seatWidth + (i > 0 ? layoutConfig.dimensions.aisleWidth : 0)),
          y: (newRow - 1) * (layoutConfig.dimensions.seatHeight + layoutConfig.dimensions.rowSpacing),
          width: layoutConfig.dimensions.seatWidth,
          height: layoutConfig.dimensions.seatHeight,
        },
        isAvailable: true,
      });
    }
    
    if (layoutConfig) {
      const updatedSeats = [...layoutConfig.seats, ...newSeats];
      const maxRow = Math.max(...updatedSeats.map(seat => seat.position.row));
      
      const newLayoutConfig = {
        ...layoutConfig,
        seats: updatedSeats,
        dimensions: {
          ...layoutConfig.dimensions,
          totalHeight: maxRow * (layoutConfig.dimensions.seatHeight + layoutConfig.dimensions.rowSpacing),
        },
      };
      
      onLayoutChange(newLayoutConfig);
    }
  };

  const removeRow = (rowNumber: number) => {
    // console.log("removeRow called with rowNumber:", rowNumber);
    if (!layoutConfig?.seats) return;
    markAsCustom(); // Mark as CUSTOM when modifying structure
    
    // Remove seats from the deleted row
    const seatsAfterDeletion = layoutConfig.seats.filter(seat => seat.position.row !== rowNumber);
    // console.log("seatsAfterDeletion:", seatsAfterDeletion);
    
    // Renumber remaining rows to be consecutive
    const rows = [...new Set(seatsAfterDeletion.map(seat => seat.position.row))].sort((a, b) => a - b);
    const rowMapping: Record<number, number> = {};
    
    // Create mapping from old row numbers to new row numbers
    rows.forEach((oldRow, index) => {
      rowMapping[oldRow] = index + 1;
    });
    
    // Update seats with new row numbers and positions
    const updatedSeats = seatsAfterDeletion.map((seat, index) => {
      const newRow = rowMapping[seat.position.row];
      
      return {
        ...seat,
        // Keep original seat ID to avoid database conflicts
        id: seat.id,
        code: `${newRow}${seat.code.substring(1)}`,
        position: {
          ...seat.position,
          row: newRow,
          y: (newRow - 1) * (layoutConfig.dimensions.seatHeight + layoutConfig.dimensions.rowSpacing),
        },
      };
    });
    
    // Note: No need to check for duplicate IDs since we keep original IDs
    // The database will handle seat identification by seat code
    
    const maxRow = updatedSeats.length > 0 ? Math.max(...updatedSeats.map(seat => seat.position.row)) : 0;
    
    if (layoutConfig) {
      onLayoutChange({
        ...layoutConfig,
        seats: updatedSeats,
        dimensions: {
          ...layoutConfig.dimensions,
          totalHeight: Math.max(maxRow * (layoutConfig.dimensions.seatHeight + layoutConfig.dimensions.rowSpacing), layoutConfig.dimensions.seatHeight),
        },
      });
    }
  };

  const addColumn = () => {
    if (!layoutConfig?.seats) return;
    if(layoutConfig.seats.length === 0) {
      markAsCustom(); // Mark as CUSTOM when modifying structure
      
      const seatId = crypto.randomUUID();
      const newSeat: SeatInfo = {
        id: seatId,
        code: `1A`,
        type: 'normal',
        position: {
          row: 1,
          position: 1,
          x: 0,
          y: 0,
          width: layoutConfig.dimensions?.seatWidth || 40,
          height: layoutConfig.dimensions?.seatHeight || 40,
        },
        isAvailable: true,
      };
      
      if (layoutConfig) {
        onLayoutChange({
          ...layoutConfig,
          seats: [newSeat],
          dimensions: {
            ...layoutConfig.dimensions,
            totalWidth: layoutConfig.dimensions?.seatWidth || 40,
            totalHeight: layoutConfig.dimensions?.seatHeight || 40,
          },
        });
      }
      return;
    }
    markAsCustom(); // Mark as CUSTOM when modifying structure
    
    const rows = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);
    
    rows.forEach(row => {
      const seatsInRow = seatsByRow[row] || [];
      const newColumn = String.fromCharCode(65 + seatsInRow.length);
      const seatId = crypto.randomUUID(); // Generate proper UUID
      
      const newSeat: SeatInfo = {
        id: seatId,
        code: `${row}${newColumn}`,
        type: 'normal',
        position: {
          x: seatsInRow.length * 50,
          y: (row - 1) * 50,
          row: row,
          position: seatsInRow.length + 1,
          width: 40,
          height: 40,
        },
        isAvailable: true,
      };
      
      layoutConfig.seats.push(newSeat);
    });
    
    const maxColumns = Math.max(...rows.map(row => seatsByRow[row].length)) + 1;
    
    if (layoutConfig) {
      onLayoutChange({
        ...layoutConfig,
        seats: [...layoutConfig.seats],
        dimensions: {
          ...layoutConfig.dimensions,
          totalWidth: maxColumns * 50,
        },
      });
    }
  };

  const removeColumn = (columnIndex: number) => {
    if (!layoutConfig?.seats) return;
    markAsCustom(); // Mark as CUSTOM when modifying structure
    
    // Filter out seats in the column to be removed
    const updatedSeats = layoutConfig.seats
      .filter(seat => seat.position.position !== columnIndex + 1)
      .map(seat => {
        // If seat is to the right of removed column, shift it left
        if (seat.position.position > columnIndex + 1) {
          return {
            ...seat,
            position: {
              ...seat.position,
              position: seat.position.position - 1,
              x: seat.position.x - 50,
            },
            // Keep original seat ID to avoid database conflicts
            id: seat.id,
            code: `${seat.position.row}${String.fromCharCode(64 + seat.position.position - 1)}`,
          };
        }
        return seat;
      });
    
    const remainingSeatsByRow: Record<number, SeatInfo[]> = {};
    updatedSeats.forEach(seat => {
      if (!remainingSeatsByRow[seat.position.row]) {
        remainingSeatsByRow[seat.position.row] = [];
      }
      remainingSeatsByRow[seat.position.row].push(seat);
    });
    
    const maxColumns = Math.max(...Object.values(remainingSeatsByRow).map(seats => seats.length), 0);
    
    if (layoutConfig) {
      onLayoutChange({
        ...layoutConfig,
        seats: updatedSeats,
        dimensions: {
          ...layoutConfig.dimensions,
          totalWidth: Math.max(maxColumns * 50, 50),
        },
      });
    }
  };

  const getSeatClass = (seat: SeatInfo) => {
    let baseClass = "w-10 h-10 flex items-center justify-center border rounded m-1 text-sm font-medium ";
    
    if (!seat.isAvailable) {
      return baseClass + "bg-gray-300 text-gray-500";
    }
    
    switch (seat.type) {
      case 'vip':
        return baseClass + "bg-purple-100 text-purple-800 border-purple-300";
      case 'business':
        return baseClass + "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return baseClass + "bg-green-100 text-green-800 border-green-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-center items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetLayout}
            disabled={readonly}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addRow}
            disabled={readonly}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addColumn}
            disabled={readonly}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Column
          </Button>
        </div>
      </div>

      <div className="overflow-auto flex justify-center">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex items-center justify-center mb-2 overflow-auto">
            <div className="w-8"></div>
            <div className="flex">
              {Object.values(seatsByRow)[0]?.map((seat, index) => (
                <div key={`col-${index}`} className="w-10 flex flex-col items-center">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    {index + 1}
                  </div>
                  {!readonly && Object.values(seatsByRow).some(row => row.length > index) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColumn(index)}
                      className="w-6 h-6 p-0"
                      title={`Remove column ${index + 1}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Seat rows */}
          {Object.entries(seatsByRow).map(([row, seats]) => (
            <div key={`row-${row}`} className="flex items-center mb-2">
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium text-gray-500 text-center w-20">Row {row}</div>
                {!readonly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(Number(row))}
                    className="w-6 h-6 p-0 mt-1"
                    title={`Remove row ${row}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex">
                {seats.map(seat => (
                  <div key={seat.id} className="relative group">
                    <button
                      type="button"
                      className={getSeatClass(seat)}
                      onClick={() => !readonly && toggleSeatAvailability(seat.id)}
                      title={`${seat.code} - ${seat.type} (${seat.isAvailable ? 'Available' : 'Unavailable'})`}
                    >
                      {seat.position.position}
                    </button>
                    {!readonly && (
                      <div className="absolute z-10 hidden group-hover:block bg-white shadow-lg rounded p-2 w-40">
                        <select
                          value={seat.type}
                          onChange={(e) => handleSeatTypeChange(seat.id, e.target.value as any)}
                          className="w-full p-1 border rounded text-sm"
                          disabled={!seat.isAvailable}
                        >
                          <option value="normal">Normal</option>
                          <option value="vip">VIP</option>
                          <option value="business">Business</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span>Normal</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
          <span>VIP</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
          <span>Business</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
