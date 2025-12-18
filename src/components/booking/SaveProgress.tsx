"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2, AlertTriangle } from "lucide-react";

interface SaveProgressProps {
  show: boolean;
  currentStep: 'passenger' | 'seats' | 'complete' | null;
  hasPassengerChanges: boolean;
  hasSeatChanges: boolean;
  error?: string;
}

export function SaveProgress({ 
  show, 
  currentStep, 
  hasPassengerChanges, 
  hasSeatChanges,
  error 
}: SaveProgressProps) {
  if (!show) return null;

  const steps = [];
  if (hasPassengerChanges) steps.push('passenger');
  if (hasSeatChanges) steps.push('seats');
  steps.push('complete');

  const currentStepIndex = currentStep ? steps.indexOf(currentStep) : -1;
  const progress = currentStep ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-2 z-50">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="font-medium text-sm">Saving Changes...</span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="space-y-2 text-xs">
            {hasPassengerChanges && (
              <div className="flex items-center gap-2">
                {currentStep === 'passenger' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                ) : steps.indexOf('passenger') < currentStepIndex ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                )}
                <span className={currentStep === 'passenger' ? 'text-blue-600 font-medium' : 
                               steps.indexOf('passenger') < currentStepIndex ? 'text-green-600' : 
                               'text-gray-500'}>
                  Update passenger information
                </span>
              </div>
            )}
            
            {hasSeatChanges && (
              <div className="flex items-center gap-2">
                {currentStep === 'seats' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                ) : steps.indexOf('seats') < currentStepIndex ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                )}
                <span className={currentStep === 'seats' ? 'text-blue-600 font-medium' : 
                               steps.indexOf('seats') < currentStepIndex ? 'text-green-600' : 
                               'text-gray-500'}>
                  Change seat assignments
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {currentStep === 'complete' ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              ) : currentStepIndex >= steps.length - 1 ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
              )}
              <span className={currentStep === 'complete' ? 'text-blue-600 font-medium' : 
                             currentStepIndex >= steps.length - 1 ? 'text-green-600' : 
                             'text-gray-500'}>
                Finalize changes
              </span>
            </div>
          </div>
          
          {error && (
            <div className="flex items-start gap-2 p-2 bg-red-50 rounded border-l-4 border-red-400">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-red-700">{error}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}