"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, CreditCard, MapPin, UserCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/formatCurrency";

interface SelectedSeat {
  id: string;
  code: string;
  type: 'normal' | 'vip' | 'business';
  price: number;
}

interface PassengerData {
  fullName: string;
  documentId: string;
  seatCode: string;
  documentType?: 'id' | 'passport' | 'license';
  phoneNumber?: string;
  email?: string;
}

interface PassengerFormItemProps {
  passengerNumber: number;
  seat: SelectedSeat;
  passengerData: PassengerData;
  onUpdate: (data: Partial<PassengerData>) => void;
  onValidationChange?: (isValid: boolean) => void; // New prop for validation state
}

export default function PassengerFormItem({ 
  passengerNumber, 
  seat, 
  passengerData, 
  onUpdate,
  onValidationChange
}: PassengerFormItemProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [canAutoFill, setCanAutoFill] = useState(false);
  const { data: currentUser } = useCurrentUser();

  // Safety check for passengerData - provide defaults if undefined
  const safePassengerData = passengerData || {
    fullName: "",
    documentId: "",
    seatCode: seat.code,
    documentType: 'id' as const,
    phoneNumber: "",
    email: ""
  };

  // Check if user is logged in and auto-fill is possible
  useEffect(() => {
    if (currentUser && currentUser.fullName && currentUser.email) {
      setCanAutoFill(true);
    } else {
      setCanAutoFill(false);
    }
  }, [currentUser]);

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
        
        case 'documentId':
          const docType = safePassengerData.documentType || 'id';
          if (!value.trim()) {
            newErrors.documentId = 'Document ID is required';
          } else {
            // Specific validation patterns based on document type
            if (docType === 'id') {
              // Vietnamese CCCD: 12 digits
              if (!/^\d{12}$/.test(value.replace(/\s/g, ''))) {
                newErrors.documentId = 'CCCD must be exactly 12 digits';
              } else {
                delete newErrors.documentId;
              }
            } else if (docType === 'passport') {
              // Passport: 8-9 alphanumeric characters
              if (!/^[A-Z0-9]{8,9}$/.test(value.toUpperCase().replace(/\s/g, ''))) {
                newErrors.documentId = 'Passport must be 8-9 alphanumeric characters';
              } else {
                delete newErrors.documentId;
              }
            } else if (docType === 'license') {
              // Driver license: 12 digits
              if (!/^\d{12}$/.test(value.replace(/\s/g, ''))) {
                newErrors.documentId = 'Driver license must be 12 digits';
              } else {
                delete newErrors.documentId;
              }
            }
          }
          break;
          
        case 'phoneNumber':
          if (value) {
            // Vietnamese phone number patterns
            const phoneRegex = /^(\+84|84|0)([3-9]\d{8})$/;
            const cleanPhone = value.replace(/[\s-()]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
              newErrors.phoneNumber = 'Invalid Vietnamese phone number format (e.g., 0912345678)';
            } else {
              delete newErrors.phoneNumber;
            }
          } else {
            delete newErrors.phoneNumber;
          }
          break;
          
        case 'email':
          if (value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
            if (!emailRegex.test(value)) {
              newErrors.email = 'Please enter a valid email address';
            } else if (value.length > 254) {
              newErrors.email = 'Email address is too long';
            } else {
              delete newErrors.email;
            }
          } else {
            delete newErrors.email;
          }
          break;
      }

      return newErrors;
    });
  }, [safePassengerData.documentType]); // Use safePassengerData instead of passengerData

  const isValidForm = useCallback((): boolean => {
    // Required fields must be filled and have no errors
    const hasRequiredFields = Boolean(safePassengerData.fullName.trim() && safePassengerData.documentId.trim());
    const errorCount = Object.keys(errors).length;
    const hasNoErrors = errorCount === 0;
    return hasRequiredFields && hasNoErrors;
  }, [safePassengerData.fullName, safePassengerData.documentId, errors]);

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

  const handleAutoFill = useCallback(() => {
    if (!currentUser) return;
    
    const autoFillData: Partial<PassengerData> = {};
    
    if (currentUser.fullName) {
      autoFillData.fullName = currentUser.fullName;
    }
    if (currentUser.email) {
      autoFillData.email = currentUser.email;
    }
    
    onUpdate(autoFillData);
    
    // Validate filled fields after a short delay
    setTimeout(() => {
      Object.entries(autoFillData).forEach(([field, value]) => {
        if (value) {
          validateField(field, value);
        }
      });
    }, 50);
  }, [currentUser, validateField]);

  const handleInputChange = useCallback((field: string, value: string) => {
    onUpdate({ [field]: value });
    // Validate on change for immediate feedback with debounce
    setTimeout(() => validateField(field, value), 100);
  }, [validateField]);

  const getSeatTypeBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return <Badge variant="secondary" className="bg-accent/10 text-accent-foreground border-accent/20">VIP</Badge>;
      case 'business':
        return <Badge variant="secondary" className="bg-primary/10 text-primary-foreground border-primary/20">Business</Badge>;
      default:
        return <Badge variant="outline" className="border-border text-muted-foreground">Normal</Badge>;
    }
  };

  const getSeatTypeColor = (type: string) => {
    switch (type) {
      case 'vip':
        return 'border-accent/20 bg-accent/5';
      case 'business':
        return 'border-primary/20 bg-primary/5';
      default:
        return 'border-border bg-muted/50';
    }
  };

  return (
    <Card className={`${getSeatTypeColor(seat.type)} transition-all duration-200`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>Passenger {passengerNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            {canAutoFill && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoFill}
                className="text-xs h-7"
                title="Fill with your account information"
              >
                <UserCheck className="w-3 h-3 mr-1" />
                Auto-fill
              </Button>
            )}
            {getSeatTypeBadge(seat.type)}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Seat {seat.code}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor={`fullName-${passengerNumber}`} className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`fullName-${passengerNumber}`}
              type="text"
              placeholder="Enter passenger's full name"
              value={safePassengerData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              onBlur={(e) => validateField('fullName', e.target.value)}
              className={errors.fullName ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? `fullName-error-${passengerNumber}` : undefined}
            />
            {errors.fullName && (
              <p 
                id={`email-error-${passengerNumber}`}
                className="text-destructive text-xs font-medium flex items-center gap-1"
                role="alert"
              >
                <span className="text-destructive">⚠</span>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor={`documentType-${passengerNumber}`} className="text-sm font-medium">
              Document Type
            </Label>
            <Select
              value={safePassengerData.documentType || 'id'}
              onValueChange={(value) => {
                onUpdate({ documentType: value as 'id' | 'passport' | 'license' });
                // Re-validate document ID when type changes
                if (safePassengerData.documentId) {
                  setTimeout(() => validateField('documentId', safePassengerData.documentId), 100);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">National ID</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="license">Driver's License</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document ID */}
          <div className="space-y-2">
            <Label htmlFor={`documentId-${passengerNumber}`} className="text-sm font-medium">
              <div className="flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                Document ID <span className="text-destructive">*</span>
              </div>
            </Label>
            <Input
              id={`documentId-${passengerNumber}`}
              type="text"
              placeholder={`Enter ${(safePassengerData.documentType || 'id') === 'id' ? 'CCCD number (12 digits)' : 
                              (safePassengerData.documentType || 'id') === 'passport' ? 'passport number' : 
                              'driver license number'}`}
              value={safePassengerData.documentId}
              onChange={(e) => {
                const docType = safePassengerData.documentType || 'id';
                const value = docType === 'passport' ? e.target.value.toUpperCase() : e.target.value;
                handleInputChange('documentId', value);
              }}
              onBlur={(e) => validateField('documentId', e.target.value)}
              className={errors.documentId ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
              maxLength={(safePassengerData.documentType || 'id') === 'passport' ? 9 : 12}
              aria-invalid={Boolean(errors.documentId)}
              aria-describedby={errors.documentId ? `documentId-error-${passengerNumber}` : undefined}
            />
            {errors.documentId && (
              <p 
                id={`documentId-error-${passengerNumber}`}
                className="text-destructive text-xs font-medium flex items-center gap-1"
                role="alert"
              >
                <span className="text-destructive">⚠</span>
                {errors.documentId}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter the exact number as it appears on your document
            </p>
          </div>

          {/* Phone Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor={`phoneNumber-${passengerNumber}`} className="text-sm font-medium">
              Phone Number (Optional)
            </Label>
            <Input
              id={`phoneNumber-${passengerNumber}`}
              type="tel"
              placeholder="0912345678 or +84912345678"
              value={safePassengerData.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              onBlur={(e) => validateField('phoneNumber', e.target.value)}
              className={errors.phoneNumber ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
              aria-invalid={Boolean(errors.phoneNumber)}
              aria-describedby={errors.phoneNumber ? `phoneNumber-error-${passengerNumber}` : undefined}
            />
            {errors.phoneNumber && (
              <p 
                id={`phoneNumber-error-${passengerNumber}`}
                className="text-destructive text-xs font-medium flex items-center gap-1"
                role="alert"
              >
                <span className="text-destructive">⚠</span>
                {errors.phoneNumber}
              </p>
            )}
          </div>
        </div>

        {/* Email (Optional) - Full Width */}
        <div className="space-y-2">
          <Label htmlFor={`email-${passengerNumber}`} className="text-sm font-medium">
            Email Address (Optional)
          </Label>
          <Input
            id={`email-${passengerNumber}`}
            type="email"
            placeholder="passenger@example.com"
            value={safePassengerData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
            onBlur={(e) => validateField('email', e.target.value)}
            className={errors.email ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `email-error-${passengerNumber}` : undefined}
          />
          {errors.email && (
            <p 
              id={`email-error-${passengerNumber}`}
              className="text-red-500 text-xs font-medium flex items-center gap-1"
              role="alert"
            >
              <span className="text-red-500">⚠</span>
              {errors.email}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional: Receive booking confirmation and updates via email
          </p>
        </div>

        {/* Seat Price Display */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Seat Price:</span>
          <span className="font-semibold text-primary">
            {formatCurrency(seat.price)}
          </span>
        </div>

        {/* Form Status Indicator */}
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
        )}

        {/* Important Notes */}
        <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
          <h4 className="text-sm font-medium text-accent-foreground mb-1">Important Notes:</h4>
          <ul className="text-xs text-accent-foreground/80 space-y-1">
            <li>• Please ensure all information matches your identification document</li>
            <li>• You will need to present the document used during booking at departure</li>
            <li>• Contact information will be used for booking updates and notifications</li>
            <li>• Fields marked with <span className="text-destructive font-medium">*</span> are required</li>
            {canAutoFill && (
              <li>• Click "Auto-fill" to use your account information</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}