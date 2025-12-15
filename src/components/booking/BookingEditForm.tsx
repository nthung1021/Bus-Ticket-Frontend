"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, User, CreditCard } from "lucide-react";

interface Passenger {
  id: string;
  fullName: string;
  documentId: string;
  seatCode: string;
}

interface BookingEditFormProps {
  passengers: Passenger[];
  onPassengerChange: (passengerId: string, field: string, value: string) => void;
}

export function BookingEditForm({ passengers, onPassengerChange }: BookingEditFormProps) {
  const [editedPassengers, setEditedPassengers] = useState<Record<string, Passenger>>(
    passengers.reduce((acc, passenger) => {
      acc[passenger.id] = { ...passenger };
      return acc;
    }, {} as Record<string, Passenger>)
  );

  const handleInputChange = (passengerId: string, field: keyof Passenger, value: string) => {
    setEditedPassengers(prev => ({
      ...prev,
      [passengerId]: {
        ...prev[passengerId],
        [field]: value
      }
    }));

    // Only call parent callback if value actually changed
    const originalPassenger = passengers.find(p => p.id === passengerId);
    if (originalPassenger && originalPassenger[field] !== value) {
      onPassengerChange(passengerId, field, value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Passenger Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {passengers.map((passenger, index) => {
          const editedPassenger = editedPassengers[passenger.id] || passenger;
          
          return (
            <div key={passenger.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Passenger {index + 1}</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  Seat: {passenger.seatCode}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`fullName-${passenger.id}`}>
                    Full Name *
                  </Label>
                  <Input
                    id={`fullName-${passenger.id}`}
                    value={editedPassenger.fullName}
                    onChange={(e) => handleInputChange(passenger.id, 'fullName', e.target.value)}
                    placeholder="Enter full name"
                    className={editedPassenger.fullName !== passenger.fullName ? "border-orange-300 bg-orange-50" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`documentId-${passenger.id}`} className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    ID/CCCD *
                  </Label>
                  <Input
                    id={`documentId-${passenger.id}`}
                    value={editedPassenger.documentId}
                    onChange={(e) => handleInputChange(passenger.id, 'documentId', e.target.value)}
                    placeholder="Enter ID/CCCD number"
                    className={editedPassenger.documentId !== passenger.documentId ? "border-orange-300 bg-orange-50" : ""}
                  />
                </div>
              </div>
              
              {(editedPassenger.fullName !== passenger.fullName || 
                editedPassenger.documentId !== passenger.documentId) && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  📝 This passenger information has been modified
                </div>
              )}
            </div>
          );
        })}
        
        <div className="text-sm text-muted-foreground">
          <p>ℹ️ You can modify passenger names and ID/CCCD numbers.</p>
          <p>Changes will be highlighted and require confirmation before saving.</p>
        </div>
      </CardContent>
    </Card>
  );
}