"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface SelectedSeat {
  id: string;
  code: string;
  type: 'normal' | 'vip' | 'business';
  price: number;
}

interface PassengerData {
  fullName: string;
  seatCode: string;
  phoneNumber?: string;
  email?: string;
}

interface PassengerFormItemProps {
  seat: SelectedSeat;
  passengerData: PassengerData;
  onUpdate: (data: Partial<PassengerData>) => void;
  onValidationChange?: (isValid: boolean) => void; // New prop for validation state
}

export default function PassengerFormItem({ 
  seat, 
  passengerData, 
  onUpdate,
  onValidationChange
}: PassengerFormItemProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Safety check for passengerData - provide defaults if undefined
  const safePassengerData = passengerData || {
    fullName: "",
    seatCode: seat.code,
    phoneNumber: "",
    email: ""
  };

  const validateField = useCallback((field: string, value: string) => {
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };

      switch (field) {
        case 'fullName':
          if (!value.trim()) {
            newErrors.fullName = 'Full name is required';
          } else if (value.trim().length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters';
          } else if (value.trim().length > 50) {
            newErrors.fullName = 'Full name cannot exceed 50 characters';
          } else if (!/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]+$/.test(value)) {
            newErrors.fullName = 'Full name can only contain letters and spaces';
          } else if (/\s{2,}/.test(value)) {
            newErrors.fullName = 'Full name cannot contain multiple consecutive spaces';
          } else {
            delete newErrors.fullName;
          }
          break;
        
        // documentId removed: no longer validated here
          
        case 'phoneNumber':
          // Phone is now required for passenger info
          if (!value || !value.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
          } else {
            const phoneRegex = /^(\+84|84|0)([3-9]\d{8})$/;
            const cleanPhone = value.replace(/[\s-()]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
              newErrors.phoneNumber = 'Invalid Vietnamese phone number format (e.g., 0912345678)';
            } else {
              delete newErrors.phoneNumber;
            }
          }
          break;
          
        case 'email':
          // Email is now required for all passengers
          if (!value || !value.trim()) {
            newErrors.email = 'Email address is required';
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            if (!emailRegex.test(value)) {
              newErrors.email = 'Please enter a valid email address';
            } else if (value.length > 254) {
              newErrors.email = 'Email address is too long';
            } else {
              delete newErrors.email;
            }
          }
          break;
      }

      return newErrors;
    });
  }, []); // validation logic is self-contained

  const isValidForm = useCallback((): boolean => {
    // Required fields must be filled and have no errors (fullName, phoneNumber, email)
    const hasRequiredFields = Boolean(
      safePassengerData.fullName.trim() && 
      (safePassengerData.phoneNumber || '').trim() &&
      (safePassengerData.email || '').trim()
    );
    const errorCount = Object.keys(errors).length;
    const hasNoErrors = errorCount === 0;
    return hasRequiredFields && hasNoErrors;
  }, [safePassengerData.fullName, safePassengerData.phoneNumber, safePassengerData.email, errors]);

  // Memoize the validation check to prevent unnecessary re-renders
  const checkAndNotifyValidation = useCallback(() => {
    const formValid = isValidForm();
    onValidationChange?.(formValid);
  }, [isValidForm]);

  // Notify parent component of validation state changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAndNotifyValidation();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [checkAndNotifyValidation]);

  const handleInputChange = useCallback((field: string, value: string) => {
    onUpdate({ [field]: value });
    // Validate on change for immediate feedback with debounce
    setTimeout(() => validateField(field, value), 100);
  }, [validateField, onUpdate]);

  return (
    <Card className="transition-all duration-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <span>Passenger & Contact Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter passenger's full name"
              value={safePassengerData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              onBlur={(e) => validateField('fullName', e.target.value)}
              className={errors.fullName ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && (
              <p 
                id="fullName-error"
                className="text-destructive text-xs font-medium flex items-center gap-1"
                role="alert"
              >
                <span className="text-destructive">⚠</span>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Document fields removed - phone is required now */}

          {/* Phone Number (Required) */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="0912345678 or +84912345678"
              value={safePassengerData.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              onBlur={(e) => validateField('phoneNumber', e.target.value)}
              className={errors.phoneNumber ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : undefined}
            />
            {errors.phoneNumber && (
              <p 
                id="phoneNumber-error"
                className="text-destructive text-xs font-medium flex items-center gap-1"
                role="alert"
              >
                <span className="text-destructive">⚠</span>
                {errors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Email (Required) - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="passenger@example.com"
            value={safePassengerData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
            onBlur={(e) => validateField('email', e.target.value)}
            className={errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p 
              id="email-error"
              className="text-red-500 text-xs font-medium flex items-center gap-1"
              role="alert"
            >
              <span className="text-red-500">⚠</span>
              {errors.email}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Required for booking confirmation and updates
          </p>
        </div>

        {/* Form Status Indicator
        {Object.keys(errors).length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <h4 className="text-sm font-medium text-destructive-foreground mb-2 flex items-center gap-1">
              <span className="text-destructive">⚠</span>
              Please fix the following issues:
            </h4>
            <ul className="text-xs text-destructive-foreground/80 space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </div>
        )} */}

        {/* Important Notes removed per request */}
      </CardContent>
    </Card>
  );
}