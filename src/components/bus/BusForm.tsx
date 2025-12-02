import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateBusDto } from "@/services/bus.service";
import { Operator } from "@/services/operator.service";

interface BusFormProps {
  isEdit?: boolean;
  formData: CreateBusDto;
  setFormData: (data: CreateBusDto) => void;
  onCancel: () => void;
  onSubmit: () => void;
  operators: Operator[];
}

export default function BusForm({ 
  isEdit = false, 
  formData, 
  setFormData, 
  onCancel, 
  onSubmit,
  operators
}: BusFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="operatorId">Operator</Label>
        <Select value={formData.operatorId} onValueChange={(value) => setFormData({ ...formData, operatorId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select an operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((operator) => (
              <SelectItem key={operator.id} value={operator.id}>
                {operator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="plateNumber">Plate Number</Label>
        <Input
          id="plateNumber"
          value={formData.plateNumber}
          onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
          placeholder="Enter plate number"
        />
      </div>
      <div>
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          placeholder="Enter bus model"
        />
      </div>
      <div>
        <Label htmlFor="seatCapacity">Seat Capacity</Label>
        <Input
          id="seatCapacity"
          type="number"
          value={formData.seatCapacity}
          onChange={(e) => setFormData({ ...formData, seatCapacity: parseInt(e.target.value) || 0 })}
          placeholder="Enter seat capacity"
        />
      </div>
      <div>
        <Label htmlFor="amenities">Amenities (comma-separated)</Label>
        <Input
          id="amenities"
          value={formData.amenities.join(", ")}
          onChange={(e) => setFormData({ ...formData, amenities: e.target.value.split(",").map(a => a.trim()).filter(a => a) })}
          placeholder="WiFi, AC, TV, USB"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? "Update" : "Create"} Bus
        </Button>
      </div>
    </div>
  );
}
