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
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorRetryModalProps {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  onGoHome: () => void;
  error: string;
  partialSuccess?: {
    passengerUpdateSuccess: boolean;
    seatUpdateSuccess: boolean;
  };
}

export function ErrorRetryModal({
  open,
  onClose,
  onRetry,
  onGoHome,
  error,
  partialSuccess
}: ErrorRetryModalProps) {
  const hasPartialSuccess = partialSuccess && 
    (partialSuccess.passengerUpdateSuccess || partialSuccess.seatUpdateSuccess);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {hasPartialSuccess ? "Partial Update Complete" : "Update Failed"}
          </DialogTitle>
          <DialogDescription>
            {hasPartialSuccess 
              ? "Some changes were applied, but others failed."
              : "There was an issue updating your booking."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasPartialSuccess && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Status:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {partialSuccess?.passengerUpdateSuccess ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Passenger information updated</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-700">Passenger update failed</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {partialSuccess?.seatUpdateSuccess ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Seat changes applied</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-700">Seat changes failed</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="p-3 bg-red-50 rounded border border-red-200">
            <p className="text-sm text-red-700">
              <span className="font-medium">Error:</span> {error}
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {hasPartialSuccess ? (
              <p>You can retry the failed changes or return to your bookings to see what was updated.</p>
            ) : (
              <p>You can try again or return to your bookings. Your booking remains unchanged.</p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onGoHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Bookings
          </Button>
          <Button
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}