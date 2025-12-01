import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateRouteDto } from "@/services/route.service";
import { Operator } from "@/services/operator.service";

interface RouteFormProps {
  isEdit?: boolean;
  formData: CreateRouteDto;
  setFormData: (data: CreateRouteDto) => void;
  onCancel: () => void;
  onSubmit: () => void;
  operators: Operator[];
}

export default function RouteForm({ 
  isEdit = false, 
  formData, 
  setFormData, 
  onCancel, 
  onSubmit,
  operators
}: RouteFormProps) {
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
        <Label htmlFor="origin">Origin</Label>
        <Input
          id="origin"
          value={formData.origin}
          onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
          placeholder="Enter origin city/location"
        />
      </div>
      <div>
        <Label htmlFor="destination">Destination</Label>
        <Input
          id="destination"
          value={formData.destination}
          onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          placeholder="Enter destination city/location"
        />
      </div>
      <div>
        <Label htmlFor="distanceKm">Distance (km)</Label>
        <Input
          id="distanceKm"
          type="number"
          value={formData.distanceKm}
          onChange={(e) => setFormData({ ...formData, distanceKm: parseFloat(e.target.value) || 0 })}
          placeholder="Enter distance in kilometers"
        />
      </div>
      <div>
        <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
        <Input
          id="estimatedMinutes"
          type="number"
          value={formData.estimatedMinutes}
          onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 0 })}
          placeholder="Enter estimated travel time in minutes"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? "Update" : "Create"} Route
        </Button>
      </div>
    </div>
  );
}
