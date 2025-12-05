"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, MapPin } from "lucide-react";

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
}

export default function PassengerFormItem({ 
  passengerNumber, 
  seat, 
  passengerData, 
  onUpdate 
}: PassengerFormItemProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = 'Full name is required';
        } else if (value.trim().length < 2) {
          newErrors.fullName = 'Full name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF]+$/.test(value)) {
          newErrors.fullName = 'Full name can only contain letters and spaces';
        } else {
          delete newErrors.fullName;
        }
        break;
      
      case 'documentId':
        if (!value.trim()) {
          newErrors.documentId = 'Document ID is required';
        } else if (value.trim().length < 6) {
          newErrors.documentId = 'Document ID must be at least 6 characters';
        } else if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
          newErrors.documentId = 'Document ID can only contain letters and numbers';
        } else {
          delete newErrors.documentId;
        }
        break;
        
      case 'phoneNumber':
        if (value && !/^[+]?[\d\s-()]+$/.test(value)) {
          newErrors.phoneNumber = 'Invalid phone number format';
        } else {
          delete newErrors.phoneNumber;
        }
        break;
        
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Invalid email format';
        } else {
          delete newErrors.email;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
    validateField(field, value);
  };

  const getSeatTypeBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">VIP</Badge>;
      case 'business':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Business</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getSeatTypeColor = (type: string) => {
    switch (type) {
      case 'vip':
        return 'border-purple-200 bg-purple-50';
      case 'business':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
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
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`fullName-${passengerNumber}`}
              type="text"
              placeholder="Enter passenger's full name"
              value={passengerData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={errors.fullName ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs">{errors.fullName}</p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor={`documentType-${passengerNumber}`} className="text-sm font-medium">
              Document Type
            </Label>
            <Select
              value={passengerData.documentType || 'id'}
              onValueChange={(value) => onUpdate({ documentType: value as 'id' | 'passport' | 'license' })}
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
                Document ID <span className="text-red-500">*</span>
              </div>
            </Label>
            <Input
              id={`documentId-${passengerNumber}`}
              type="text"
              placeholder="Enter document number"
              value={passengerData.documentId}
              onChange={(e) => handleInputChange('documentId', e.target.value.toUpperCase())}
              className={errors.documentId ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {errors.documentId && (
              <p className="text-red-500 text-xs">{errors.documentId}</p>
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
              placeholder="+84 123 456 789"
              value={passengerData.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs">{errors.phoneNumber}</p>
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
            value={passengerData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'border-red-500 focus:ring-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional: Receive booking confirmation and updates via email
          </p>
        </div>

        {/* Seat Price Display */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Seat Price:</span>
          <span className="font-semibold text-primary">
            {seat.price.toLocaleString('vi-VN')} VNĐ
          </span>
        </div>

        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-amber-800 mb-1">Important Notes:</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Please ensure all information matches your identification document</li>
            <li>• You will need to present the document used during booking at departure</li>
            <li>• Contact information will be used for booking updates and notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}