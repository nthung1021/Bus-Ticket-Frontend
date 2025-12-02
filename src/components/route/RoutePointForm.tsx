import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, MapPin } from "lucide-react";
import { RoutePoint } from "@/services/route.service";

interface RoutePointFormProps {
  routePoints: Omit<RoutePoint, 'id' | 'routeId' | 'createdAt' | 'updatedAt'>[];
  setRoutePoints: (points: Omit<RoutePoint, 'id' | 'routeId' | 'createdAt' | 'updatedAt'>[]) => void;
}

export default function RoutePointForm({ routePoints, setRoutePoints }: RoutePointFormProps) {
  const [newPoint, setNewPoint] = useState<Omit<RoutePoint, 'id' | 'routeId' | 'createdAt' | 'updatedAt'>>({
    name: "",
    latitude: 0,
    longitude: 0,
    type: "both",
    order: routePoints.length + 1,
    distanceFromStart: undefined,
    estimatedTimeFromStart: undefined,
  });

  const addRoutePoint = () => {
    if (newPoint.name && newPoint.latitude && newPoint.longitude) {
      setRoutePoints([...routePoints, { ...newPoint, order: routePoints.length + 1 }]);
      setNewPoint({
        name: "",
        latitude: 0,
        longitude: 0,
        type: "both",
        order: routePoints.length + 2,
        distanceFromStart: undefined,
        estimatedTimeFromStart: undefined,
      });
    }
  };

  const removeRoutePoint = (index: number) => {
    const updatedPoints = routePoints.filter((_, i) => i !== index);
    // Reorder the remaining points
    const reorderedPoints = updatedPoints.map((point, i) => ({
      ...point,
      order: i + 1,
    }));
    setRoutePoints(reorderedPoints);
  };

  const updateRoutePoint = (index: number, field: keyof Omit<RoutePoint, 'id' | 'routeId' | 'createdAt' | 'updatedAt'>, value: any) => {
    const updatedPoints = routePoints.map((point, i) => 
      i === index ? { ...point, [field]: value } : point
    );
    setRoutePoints(updatedPoints);
  };

  const getPointTypeColor = (type: string) => {
    switch (type) {
      case 'pickup': return 'bg-blue-100 text-blue-800';
      case 'dropoff': return 'bg-green-100 text-green-800';
      case 'both': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Route Points</Label>
        <span className="text-sm text-muted-foreground">
          {routePoints.length} point{routePoints.length !== 1 ? 's' : ''} added
        </span>
      </div>

      {/* Existing Route Points */}
      {routePoints.length > 0 && (
        <div className="space-y-2">
          {routePoints.map((point, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">Point Name</Label>
                      <Input
                        value={point.name}
                        onChange={(e) => updateRoutePoint(index, 'name', e.target.value)}
                        placeholder="e.g., Central Station"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Label className="text-sm">Latitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={point.latitude}
                          onChange={(e) => updateRoutePoint(index, 'latitude', parseFloat(e.target.value) || 0)}
                          placeholder="10.762622"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm">Longitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={point.longitude}
                          onChange={(e) => updateRoutePoint(index, 'longitude', parseFloat(e.target.value) || 0)}
                          placeholder="106.660172"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm">Type</Label>
                      <Select value={point.type} onValueChange={(value: 'pickup' | 'dropoff' | 'both') => updateRoutePoint(index, 'type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Pickup Only</SelectItem>
                          <SelectItem value="dropoff">Dropoff Only</SelectItem>
                          <SelectItem value="both">Pickup & Dropoff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Label className="text-sm">Distance (m)</Label>
                        <Input
                          type="number"
                          value={point.distanceFromStart || ''}
                          onChange={(e) => updateRoutePoint(index, 'distanceFromStart', parseInt(e.target.value) || undefined)}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm">Time (min)</Label>
                        <Input
                          type="number"
                          value={point.estimatedTimeFromStart || ''}
                          onChange={(e) => updateRoutePoint(index, 'estimatedTimeFromStart', parseInt(e.target.value) || undefined)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-muted-foreground">#{point.order}</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getPointTypeColor(point.type)}`}>
                      {point.type}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRoutePoint(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Route Point */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add New Route Point
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Point Name</Label>
              <Input
                value={newPoint.name}
                onChange={(e) => setNewPoint({ ...newPoint, name: e.target.value })}
                placeholder="e.g., Central Station"
              />
            </div>
            <div>
              <Label className="text-sm">Type</Label>
              <Select value={newPoint.type} onValueChange={(value: 'pickup' | 'dropoff' | 'both') => setNewPoint({ ...newPoint, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup Only</SelectItem>
                  <SelectItem value="dropoff">Dropoff Only</SelectItem>
                  <SelectItem value="both">Pickup & Dropoff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Latitude</Label>
              <Input
                type="number"
                step="any"
                value={newPoint.latitude}
                onChange={(e) => setNewPoint({ ...newPoint, latitude: parseFloat(e.target.value) || 0 })}
                placeholder="10.762622"
              />
            </div>
            <div>
              <Label className="text-sm">Longitude</Label>
              <Input
                type="number"
                step="any"
                value={newPoint.longitude}
                onChange={(e) => setNewPoint({ ...newPoint, longitude: parseFloat(e.target.value) || 0 })}
                placeholder="106.660172"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Distance from Start (meters)</Label>
              <Input
                type="number"
                value={newPoint.distanceFromStart || ''}
                onChange={(e) => setNewPoint({ ...newPoint, distanceFromStart: parseInt(e.target.value) || undefined })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="text-sm">Estimated Time from Start (min)</Label>
              <Input
                type="number"
                value={newPoint.estimatedTimeFromStart || ''}
                onChange={(e) => setNewPoint({ ...newPoint, estimatedTimeFromStart: parseInt(e.target.value) || undefined })}
                placeholder="Optional"
              />
            </div>
          </div>
          <Button 
            onClick={addRoutePoint}
            disabled={!newPoint.name || !newPoint.latitude || !newPoint.longitude}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Route Point
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
