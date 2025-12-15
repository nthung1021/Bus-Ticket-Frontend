"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, ArrowRight, CreditCard, Armchair } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface Booking {
  id: string;
  reference: string;
  totalAmount: number;
  passengers: Array<{
    id: string;
    fullName: string;
    documentId: string;
    seatCode: string;
  }>;
}

interface ChangeData {
  passengerChanges: Array<{
    id: string;
    fullName?: string;
    documentId?: string;
  }>;
  seatChanges: Array<{
    passengerId: string;
    oldSeatCode: string;
    newSeatCode: string;
  }>;
  priceDifference: number;
}

interface ConfirmChangesModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changes: ChangeData;
  booking: Booking;
  loading?: boolean;
}

export function ConfirmChangesModal({
  open,
  onClose,
  onConfirm,
  changes,
  booking,
  loading = false
}: ConfirmChangesModalProps) {
  const getPassengerName = (passengerId: string) => {
    const passenger = booking.passengers.find(p => p.id === passengerId);
    return passenger?.fullName || "Unknown";
  };

  const hasChanges = changes.passengerChanges.length > 0 || changes.seatChanges.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Booking Changes</DialogTitle>
          <DialogDescription>
            Please review the changes below before confirming. These changes will update your booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Booking Reference</p>
                  <p className="text-sm text-muted-foreground">{booking.reference}</p>
                </div>
                <Badge variant="outline">
                  {booking.passengers.length} passenger{booking.passengers.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Passenger Information Changes */}
          {changes.passengerChanges.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Passenger Information Changes
              </h3>
              <div className="space-y-3">
                {changes.passengerChanges.map(change => {
                  const passenger = booking.passengers.find(p => p.id === change.id);
                  if (!passenger) return null;

                  return (
                    <Card key={change.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <p className="font-medium">{passenger.fullName}</p>
                          
                          {change.fullName && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="line-through">{passenger.fullName}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="text-green-600 font-medium">{change.fullName}</span>
                            </div>
                          )}
                          
                          {change.documentId && (
                            <div className="flex items-center gap-2 text-sm">
                              <CreditCard className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">ID/CCCD:</span>
                              <span className="line-through">{passenger.documentId}</span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="text-green-600 font-medium">{change.documentId}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seat Changes */}
          {changes.seatChanges.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Armchair className="w-4 h-4" />
                Seat Changes
              </h3>
              <div className="space-y-3">
                {changes.seatChanges.map(seatChange => (
                  <Card key={seatChange.passengerId}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{getPassengerName(seatChange.passengerId)}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Seat:</span>
                            <Badge variant="outline">{seatChange.oldSeatCode}</Badge>
                            <ArrowRight className="w-3 h-3" />
                            <Badge variant="default">{seatChange.newSeatCode}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <h3 className="font-medium">Price Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Total:</span>
                    <span>{formatCurrency(booking.totalAmount)}</span>
                  </div>
                  
                  {changes.priceDifference !== 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span>Price Change:</span>
                        <span className={changes.priceDifference > 0 ? "text-red-600" : "text-green-600"}>
                          {changes.priceDifference > 0 ? "+" : ""}{formatCurrency(changes.priceDifference)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between font-medium">
                        <span>New Total:</span>
                        <span>{formatCurrency(booking.totalAmount + changes.priceDifference)}</span>
                      </div>
                    </>
                  )}
                  
                  {changes.priceDifference === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No price changes
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>⚠️ Changes will be applied immediately after confirmation.</p>
            <p>📧 You will receive an updated booking confirmation via email.</p>
            {changes.priceDifference > 0 && (
              <p>💳 Additional payment may be required for price increases.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || !hasChanges}
          >
            {loading ? "Saving..." : "Confirm Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}