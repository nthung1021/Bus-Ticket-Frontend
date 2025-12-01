"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import TextSeatEditor from './TextSeatEditor';
import {
  SeatLayout,
  SeatLayoutType,
  CreateSeatFromTemplateDto,
  SeatPricingConfig,
  SeatLayoutConfig,
  LayoutTemplate,
} from '@/services/seat-layout.service';
import { seatLayoutService } from '@/services/seat-layout.service';
import { toast } from 'sonner';
import { Loader2, Save, Eye, Settings } from 'lucide-react';

interface SeatLayoutDialogProps {
  busId: string;
  busPlateNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLayout?: SeatLayout;
  onSuccess?: () => void;
}

export default function SeatLayoutDialog({
  busId,
  busPlateNumber,
  open,
  onOpenChange,
  existingLayout,
  onSuccess,
}: SeatLayoutDialogProps) {
  const [activeTab, setActiveTab] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState<LayoutTemplate | null>(null);
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Layout state
  const [layoutType, setLayoutType] = useState<SeatLayoutType>(SeatLayoutType.STANDARD_2X2);
  const [layoutConfig, setLayoutConfig] = useState<SeatLayoutConfig | null>(null);
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
        setActiveTab('custom');
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
  }, [open, existingLayout]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await seatLayoutService.getTemplates();
      console.log(response)
      setTemplates(response.templates);
    } catch (error) {
      toast.error('Failed to load templates');
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
      console.log(createDto)
      const newLayout = await seatLayoutService.createFromTemplate(createDto);
      toast.success('Seat layout created successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create seat layout');
    } finally {
      setSaving(false);
    }
  };

  const updateExistingLayout = async () => {
    if (!existingLayout || !layoutConfig) return;

    try {
      setSaving(true);
      await seatLayoutService.update(existingLayout.id, {
        layoutConfig,
        seatPricing: pricingConfig,
      });
      toast.success('Seat layout updated successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update seat layout');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = async (template: LayoutTemplate) => {
    setSelectedTemplate(template);
    setLayoutType(template.type);

    try {
      setLoading(true);
      // Create a temporary layout to preview the template
      const tempDto: CreateSeatFromTemplateDto = {
        busId: 'temp', // Temporary ID for preview
        layoutType: template.type,
        seatPricing: pricingConfig,
      };

      // We'll need to create a preview endpoint or mock the data
      // For now, let's create a basic preview based on template type
      const mockConfig = generateMockLayoutConfig(template.type);
      setLayoutConfig(mockConfig);
    } catch (error) {
      toast.error('Failed to load template preview');
    } finally {
      setLoading(false);
    }
  };

  const generateMockLayoutConfig = (type: SeatLayoutType): SeatLayoutConfig => {
    const baseConfig = {
      aisles: [1],
      dimensions: {
        totalWidth: 200,
        totalHeight: 400,
        seatWidth: 40,
        seatHeight: 40,
        aisleWidth: 30,
        rowSpacing: 10,
      },
    };

    switch (type) {
      case SeatLayoutType.STANDARD_2X2:
        return {
          ...baseConfig,
          seats: Array.from({ length: 24 }, (_, i) => ({
            id: `seat-${i + 1}`,
            code: `${Math.floor(i / 2) + 1}${String.fromCharCode(65 + (i % 2))}`,
            type: 'normal' as const,
            position: {
              row: Math.floor(i / 2) + 1,
              position: (i % 2) + 1,
              x: (i % 2) * 70,
              y: Math.floor(i / 2) * 50,
              width: 40,
              height: 40,
            },
            isAvailable: true,
          })),
        };
      
      case SeatLayoutType.STANDARD_2X3:
        return {
          ...baseConfig,
          aisles: [1, 2],
          dimensions: {
            ...baseConfig.dimensions,
            totalWidth: 230,
          },
          seats: Array.from({ length: 30 }, (_, i) => ({
            id: `seat-${i + 1}`,
            code: `${Math.floor(i / 3) + 1}${String.fromCharCode(65 + (i % 3))}`,
            type: i % 3 === 1 ? 'vip' as const : 'normal' as const,
            position: {
              row: Math.floor(i / 3) + 1,
              position: (i % 3) + 1,
              x: (i % 3) * 65,
              y: Math.floor(i / 3) * 50,
              width: 35,
              height: 40,
            },
            isAvailable: true,
          })),
        };
      
      case SeatLayoutType.VIP_1X2:
        return {
          ...baseConfig,
          dimensions: {
            ...baseConfig.dimensions,
            seatWidth: 50,
            seatHeight: 50,
          },
          seats: Array.from({ length: 16 }, (_, i) => ({
            id: `seat-${i + 1}`,
            code: `${Math.floor(i / 2) + 1}${String.fromCharCode(65 + (i % 2))}`,
            type: 'vip' as const,
            position: {
              row: Math.floor(i / 2) + 1,
              position: (i % 2) + 1,
              x: (i % 2) * 90,
              y: Math.floor(i / 2) * 60,
              width: 50,
              height: 50,
            },
            isAvailable: true,
          })),
        };
      
      case SeatLayoutType.SLEEPER_1X2:
        return {
          ...baseConfig,
          dimensions: {
            ...baseConfig.dimensions,
            seatWidth: 60,
            seatHeight: 80,
            rowSpacing: 20,
          },
          seats: Array.from({ length: 12 }, (_, i) => ({
            id: `seat-${i + 1}`,
            code: `${Math.floor(i / 2) + 1}${String.fromCharCode(65 + (i % 2))}`,
            type: 'business' as const,
            position: {
              row: Math.floor(i / 2) + 1,
              position: (i % 2) + 1,
              x: (i % 2) * 100,
              y: Math.floor(i / 2) * 100,
              width: 60,
              height: 80,
            },
            isAvailable: true,
          })),
        };
      
      default:
        return baseConfig as SeatLayoutConfig;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingLayout ? 'Edit Seat Layout' : 'Configure Seat Layout'} - {busPlateNumber}
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
                        ? 'ring-2 ring-blue-500'
                        : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="secondary">{template.totalSeats} seats</Badge>
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
                  <h3 className="text-lg font-semibold mb-4">Pricing Configuration</h3>
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
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            {layoutConfig ? (
              <TextSeatEditor
                layoutConfig={layoutConfig}
                pricingConfig={pricingConfig}
                onLayoutChange={setLayoutConfig}
                onPricingChange={setPricingConfig}
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
          {activeTab === 'template' && selectedTemplate && !existingLayout && (
            <Button onClick={() => createFromTemplate(selectedTemplate)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Layout
            </Button>
          )}
          {activeTab === 'custom' && existingLayout && layoutConfig && (
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
