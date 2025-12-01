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

export default function OperatorForm({ 
  isEdit = false, 
  formData, 
  setFormData, 
  onCancel, 
  onSubmit 
}: OperatorFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Operator Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter operator name"
        />
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
      </div>
      <div>
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          placeholder="Enter contact phone"
        />
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
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? "Update" : "Create"} Operator
        </Button>
      </div>
    </div>
  );
}
