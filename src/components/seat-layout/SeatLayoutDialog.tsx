"use client";

import React, { useState, useEffect } from "react";
import {
  SeatInfo,
  SeatLayoutType,
  SeatLayoutConfig,
  seatLayoutService,
} from "../../services/seat-layout.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SeatEditor from "./SeatEditor";
import {
  SeatLayout,
  CreateSeatFromTemplateDto,
  SeatPricingConfig,
  LayoutTemplate,
} from "@/services/seat-layout.service";
import toast from "react-hot-toast";
import { Loader2, Save, Eye, Settings } from "lucide-react";

interface SeatLayoutDialogProps {
  busId: string;
  busPlateNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLayout?: SeatLayout;
  onSuccess?: () => void;
  onBusSeatLayoutUpdate?: (busId: string, layout: SeatLayout) => void;
}

export default function SeatLayoutDialog({
  busId,
  busPlateNumber,
  open,
  onOpenChange,
  existingLayout,
  onSuccess,
  onBusSeatLayoutUpdate,
}: SeatLayoutDialogProps) {
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] =
    useState<LayoutTemplate | null>(null);
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Layout state
  const [layoutType, setLayoutType] = useState<SeatLayoutType>(
    SeatLayoutType.STANDARD_2X2
  );
  const [layoutConfig, setLayoutConfig] = useState<SeatLayoutConfig | null>(
    null
  );
  const [pricingConfig, setPricingConfig] = useState<SeatPricingConfig>({
    basePrice: 100000,
    seatTypePrices: {
      normal: 100000,
      vip: 150000,
      business: 200000,
    },
    rowPricing: {},
    positionPricing: {},
  });

  useEffect(() => {
    if (open) {
      fetchTemplates();
      if (existingLayout) {
        setLayoutType(existingLayout.layoutType);
        setLayoutConfig(existingLayout.layoutConfig);
        setPricingConfig(existingLayout.seatPricing);
        setActiveTab("custom");
      } else {
        // Initialize with default pricing
        setPricingConfig({
          basePrice: 100000,
          seatTypePrices: {
            normal: 100000,
            vip: 150000,
            business: 200000,
          },
          rowPricing: {},
          positionPricing: {},
        });
      }
    }
  }, [open]); // Remove existingLayout from dependency array

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await seatLayoutService.getTemplates();
      // console.log(response)
      setTemplates(response.templates);
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const createFromTemplate = async (template: LayoutTemplate) => {
    try {
      setSaving(true);
      const createDto: CreateSeatFromTemplateDto = {
        busId,
        layoutType: template.type,
        seatPricing: pricingConfig,
      };
      // console.log(createDto)
      const newLayout = await seatLayoutService.createFromTemplate(createDto);
      toast.success("Seat layout created successfully");
      onBusSeatLayoutUpdate?.(busId, newLayout);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage || "Failed to create seat layout");
    } finally {
      setSaving(false);
    }
  };

  const updateExistingLayout = async () => {
    if (!existingLayout || !layoutConfig) return;

    try {
      setSaving(true);

      // Calculate total rows and seats per row from layoutConfig
      const rows = [
        ...new Set(layoutConfig.seats.map((seat) => seat.position.row)),
      ];
      const totalRows =
        layoutConfig.seats.length > 0 ? Math.max(...rows, 1) : 0;
      const seatsPerRow =
        layoutConfig.seats.length > 0
          ? Math.max(
              ...Object.values(
                layoutConfig.seats.reduce(
                  (acc, seat) => {
                    if (!acc[seat.position.row]) acc[seat.position.row] = [];
                    acc[seat.position.row].push(seat);
                    return acc;
                  },
                  {} as Record<number, any>
                )
              ).map((seats: any) => seats.length),
              1
            )
          : 0;

      // Remove price field from seats as it's not required in backend
      const cleanedLayoutConfig = {
        ...layoutConfig,
        seats: layoutConfig.seats.map(({ price, ...seat }) => seat),
      };

      const updatedLayout = await seatLayoutService.update(existingLayout.id, {
        layoutType: existingLayout.layoutType || "custom",
        totalRows,
        seatsPerRow,
        layoutConfig: cleanedLayoutConfig,
        seatPricing: pricingConfig,
      });
      toast.success("Seat layout updated successfully");
      onBusSeatLayoutUpdate?.(busId, updatedLayout);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage || "Failed to update seat layout");
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = async (template: LayoutTemplate) => {
    setSelectedTemplate(template);
    try {
      setLayoutType(template.type);

      // Get template config from backend
      const mockConfig = await generateMockLayoutConfig(template.type);
      setLayoutConfig(mockConfig);

      // If there's an existing layout, update it with the new template
      if (existingLayout) {
        await updateExistingLayoutWithTemplate(template, mockConfig);
      }
    } catch (error) {
      toast.error("Failed to load template preview");
    } finally {
      setLoading(false);
    }
  };

  const extractErrorMessage = (error: any): string => {
    // Try to extract error message from different possible error structures
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.response?.data?.errors?.length > 0) {
      return error.response.data.errors.join(", ");
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unexpected error occurred";
  };

  const handleLayoutTypeChange = async (type: SeatLayoutType) => {
    if (!existingLayout || !layoutConfig) return;

    try {
      setSaving(true);
      setSelectedTemplate(null);

      // Calculate totalRows and seatsPerRow from seats
      const rows = [
        ...new Set(layoutConfig.seats.map((seat) => seat.position.row)),
      ];
      const totalRows = rows.length > 0 ? Math.max(...rows) : 0;
      const seatsPerRow = Math.max(
        ...layoutConfig.seats.map((seat) => seat.position.position),
        0
      );

      // Call API to update
      // In the handleLayoutTypeChange function, update the API call to include seatPricing
      const updatedLayout = await seatLayoutService.update(existingLayout.id, {
        layoutType: type,
        totalRows,
        seatsPerRow,
        layoutConfig: {
          ...layoutConfig,
          seats: layoutConfig.seats.map(({ price, ...seat }) => seat),
        },
        seatPricing: pricingConfig, // Add this line
      });
      // console.log('updated layout', updatedLayout)
      setLayoutType(type);
      toast.success("Layout type updated successfully");
      onBusSeatLayoutUpdate?.(busId, updatedLayout);
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      console.error("Error updating layout type:", error);
      toast.error(errorMessage);
      // Revert UI state on error
      if (existingLayout) {
        setLayoutType(existingLayout.layoutType);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateExistingLayoutWithTemplate = async (
    template: LayoutTemplate,
    config: SeatLayoutConfig
  ) => {
    if (!existingLayout) return;

    try {
      setSaving(true);

      // Calculate total rows and seats per row from layoutConfig
      const rows = [...new Set(config.seats.map((seat) => seat.position.row))];
      const totalRows = config.seats.length > 0 ? Math.max(...rows, 1) : 0;
      const seatsPerRow =
        config.seats.length > 0
          ? Math.max(
              ...Object.values(
                config.seats.reduce(
                  (acc, seat) => {
                    if (!acc[seat.position.row]) acc[seat.position.row] = [];
                    acc[seat.position.row].push(seat);
                    return acc;
                  },
                  {} as Record<number, any>
                )
              ).map((seats: any) => seats.length),
              1
            )
          : 0;

      // Remove price field from seats as it's not required in backend
      const cleanedLayoutConfig = {
        ...config,
        seats: config.seats.map(({ price, ...seat }) => seat),
      };

      const updatedLayout = await seatLayoutService.update(existingLayout.id, {
        layoutType: template.type,
        totalRows,
        seatsPerRow,
        layoutConfig: cleanedLayoutConfig,
        seatPricing: pricingConfig,
      });
      toast.success("Seat layout updated with new template");
      onBusSeatLayoutUpdate?.(busId, updatedLayout);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage || "Failed to update seat layout");
    } finally {
      setSaving(false);
    }
  };

  const generateMockLayoutConfig = async (
    type: SeatLayoutType
  ): Promise<SeatLayoutConfig> => {
    try {
      const templateConfig = await seatLayoutService.getTemplateConfig(type);
      return templateConfig.layoutConfig;
    } catch (error) {
      console.error("Error fetching template config:", error);
      // Fallback to a basic config if API fails
      return {
        seats: [],
        aisles: [1],
        dimensions: {
          totalWidth: 0,
          totalHeight: 0,
          seatWidth: 40,
          seatHeight: 40,
          aisleWidth: 30,
          rowSpacing: 10,
        },
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingLayout ? "Edit Seat Layout" : "Configure Seat Layout"} -{" "}
            {busPlateNumber}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Template Configuration
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Custom Layout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
              {loading ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.type}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.type === template.type
                        ? "ring-2 ring-blue-500"
                        : ""
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {template.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="secondary">
                          {template.totalSeats} seats
                        </Badge>
                        <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                          {template.preview}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {selectedTemplate && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Pricing Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Base Price (VND)</Label>
                      <Input
                        type="number"
                        value={pricingConfig.basePrice}
                        onChange={(e) =>
                          setPricingConfig({
                            ...pricingConfig,
                            basePrice: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Normal Seat Price (VND)</Label>
                      <Input
                        type="number"
                        value={pricingConfig.seatTypePrices.normal}
                        onChange={(e) =>
                          setPricingConfig({
                            ...pricingConfig,
                            seatTypePrices: {
                              ...pricingConfig.seatTypePrices,
                              normal: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>VIP Seat Price (VND)</Label>
                      <Input
                        type="number"
                        value={pricingConfig.seatTypePrices.vip}
                        onChange={(e) =>
                          setPricingConfig({
                            ...pricingConfig,
                            seatTypePrices: {
                              ...pricingConfig.seatTypePrices,
                              vip: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Business Seat Price (VND)</Label>
                      <Input
                        type="number"
                        value={pricingConfig.seatTypePrices.business}
                        onChange={(e) =>
                          setPricingConfig({
                            ...pricingConfig,
                            seatTypePrices: {
                              ...pricingConfig.seatTypePrices,
                              business: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 space-x-2">
                    <Button
                      onClick={async () => {
                        try {
                          setSaving(true);
                          if (existingLayout) {
                            // Update existing layout with new pricing
                            await updateExistingLayout();
                          } else if (selectedTemplate) {
                            // Create new layout from template
                            await createFromTemplate(selectedTemplate);
                          }
                        } catch (error) {
                          console.error("Error saving layout:", error);
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {existingLayout ? "Update" : "Save"} Pricing
                          Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            {layoutConfig ? (
              <SeatEditor
                layoutConfig={layoutConfig}
                pricingConfig={pricingConfig}
                onLayoutChange={setLayoutConfig}
                onPricingChange={setPricingConfig}
                onLayoutTypeChange={handleLayoutTypeChange}
                readonly={false}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a template first or load existing layout to customize
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === "template" && selectedTemplate && !existingLayout && (
            <Button
              onClick={() => createFromTemplate(selectedTemplate)}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Layout
            </Button>
          )}
          {activeTab === "custom" && existingLayout && layoutConfig && (
            <Button onClick={updateExistingLayout} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Update Layout
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
