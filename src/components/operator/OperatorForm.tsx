import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateOperatorDto, OperatorStatus } from "@/services/operator.service";

interface OperatorFormProps {
  isEdit?: boolean;
  formData: CreateOperatorDto;
  setFormData: (data: CreateOperatorDto) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function OperatorForm({
  isEdit = false,
  formData,
  setFormData,
  onCancel,
  onSubmit,
}: OperatorFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "Name is required (min 3 characters).";
    }
    if (!formData.contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Valid email is required.";
    }
    if (!formData.contactPhone || !/^\+?\d{8,15}$/.test(formData.contactPhone.replace(/[-\s]/g, ""))) {
      newErrors.contactPhone = "Valid phone (8-15 digits) required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    } else {
      toast.error("Please fix the form errors.");
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div>
        <Label htmlFor="name">Operator Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter operator name"
        />
        {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
      </div>
      <div>
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          placeholder="Enter contact email"
        />
        {errors.contactEmail && <div className="text-red-500 text-xs mt-1">{errors.contactEmail}</div>}
      </div>
      <div>
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          placeholder="Enter contact phone"
        />
        {errors.contactPhone && <div className="text-red-500 text-xs mt-1">{errors.contactPhone}</div>}
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as OperatorStatus })}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OperatorStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={OperatorStatus.APPROVED}>Approved</SelectItem>
            <SelectItem value={OperatorStatus.SUSPENDED}>Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEdit ? "Update" : "Create"} Operator
        </Button>
      </div>
    </form>
  );
}
