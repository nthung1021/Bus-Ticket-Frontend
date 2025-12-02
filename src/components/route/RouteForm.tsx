import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateRouteDto, RoutePoint } from "@/services/route.service";
import { Operator } from "@/services/operator.service";
import RoutePointForm from "./RoutePointForm";

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
  const handleAmenitiesChange = (amenity: string, checked: boolean) => {
    const currentAmenities = formData.amenities || [];
    if (checked) {
      setFormData({ ...formData, amenities: [...currentAmenities, amenity] });
    } else {
      setFormData({ ...formData, amenities: currentAmenities.filter(a => a !== amenity) });
    }
  };

  const availableAmenities = [
    'WiFi', 'Air Conditioning', 'Power Outlets', 'Restroom', 
    'TV Entertainment', 'Reclining Seats', 'Snacks', 'Drinks'
  ];

  return (
    <div className="space-y-6 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="name">Route Name</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Ho Chi Minh City - Nha Trang Route"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="origin">Origin</Label>
          <Input
            id="origin"
            value={formData.origin || ''}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            placeholder="e.g., Ho Chi Minh City"
          />
        </div>
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            value={formData.destination || ''}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            placeholder="e.g., Nha Trang"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="distanceKm">Distance (km)</Label>
          <Input
            id="distanceKm"
            type="number"
            step="0.1"
            value={formData.distanceKm || ''}
            onChange={(e) => setFormData({ ...formData, distanceKm: parseFloat(e.target.value) || 0 })}
            placeholder="e.g., 450.5"
          />
        </div>
        <div>
          <Label htmlFor="estimatedMinutes">Estimated Duration (minutes)</Label>
          <Input
            id="estimatedMinutes"
            type="number"
            value={formData.estimatedMinutes || ''}
            onChange={(e) => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value) || 0 })}
            placeholder="e.g., 360"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the route, major stops, and any special information"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-base font-medium">Amenities</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {availableAmenities.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={(formData.amenities || []).includes(amenity)}
                onCheckedChange={(checked) => handleAmenitiesChange(amenity, checked as boolean)}
              />
              <Label htmlFor={amenity} className="text-sm font-normal">
                {amenity}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <RoutePointForm 
        routePoints={formData.points || []}
        setRoutePoints={(points) => setFormData({ ...formData, points })}
      />

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
