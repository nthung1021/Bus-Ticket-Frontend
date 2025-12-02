"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Route, Bus, Trip, TripStatus, formatDateForBackend } from "@/services/trip.service";
import {
    Toast,
    ToastProvider,
    ToastViewport,
    ToastTitle,
    ToastDescription,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

const tripFormSchema = z
    .object({
        routeId: z.string().min(1, "Please select a route"),
        busId: z.string().min(1, "Please select a bus"),
        departureTime: z.date({
            required_error: "Departure time is required",
        }),
        arrivalTime: z.date({
            required_error: "Arrival time is required",
        }),
        basePrice: z
            .string()
            .min(1, "Base price is required")
            .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
                message: "Base price must be a positive number",
            }),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled", "delayed"]),
    })
    .refine((data) => data.arrivalTime > data.departureTime, {
        message: "Arrival time must be after departure time",
        path: ["arrivalTime"],
    });

type TripFormValues = z.infer<typeof tripFormSchema>;

interface TripFormProps {
    initialData?: Trip;
    onSubmit: (data: TripFormValues) => Promise<void>;
    onCancel: () => void;
    routes: Route[];
    buses: Bus[];
    isLoading?: boolean;
    className?: string;
}

export function TripForm({
    initialData,
    onSubmit,
    onCancel,
    routes,
    buses,
    isLoading = false,
    className,
}: TripFormProps) {
    const { toast } = useToast();

    const form = useForm<TripFormValues>({
        resolver: zodResolver(tripFormSchema),
        defaultValues: {
            routeId: initialData?.routeId || "",
            busId: initialData?.busId || "",
            departureTime: initialData?.departureTime || new Date(),
            arrivalTime: initialData?.arrivalTime || new Date(),
            basePrice: initialData?.basePrice ? initialData.basePrice.toString() : "",
            status: initialData?.status || TripStatus.SCHEDULED,
        },
    });

    const handleSubmit = async (data: TripFormValues) => {
        try {
            // Convert Date objects to ISO strings for API
            const apiData = {
                ...data,
                departureTime: formatDateForBackend(data.departureTime),
                arrivalTime: formatDateForBackend(data.arrivalTime),
            };
            await onSubmit(apiData as any);
        } catch (error: any) {
            console.error("Form submission error:", error);

            // Extract and display backend error messages
            let errorMessage = "Failed to create trip";

            if (error?.response?.data?.message) {
                if (Array.isArray(error.response.data.message)) {
                    errorMessage = error.response.data.message.join(", ");
                } else {
                    errorMessage = error.response.data.message;
                }
            } else if (error?.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            // Show error toast
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className={cn("space-y-6", className)}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Route Selection */}
                    <FormField
                        control={form.control}
                        name="routeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Route</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a route" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {routes.map((route) => (
                                            <SelectItem key={route.id} value={route.id}>
                                                {route.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Choose the route for this trip
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Bus Selection */}
                    <FormField
                        control={form.control}
                        name="busId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bus</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a bus" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {buses.map((bus) => (
                                            <SelectItem key={bus.id} value={bus.id}>
                                                {bus.plateNumber} - {bus.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Choose the bus for this trip
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Departure Time */}
                    <FormField
                        control={form.control}
                        name="departureTime"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Departure Time</FormLabel>
                                <DateTimePicker
                                    date={field.value}
                                    setDate={field.onChange}
                                    placeholder="Select departure time"
                                />
                                <FormDescription>
                                    When the trip will depart
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Arrival Time */}
                    <FormField
                        control={form.control}
                        name="arrivalTime"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Arrival Time</FormLabel>
                                <DateTimePicker
                                    date={field.value}
                                    setDate={field.onChange}
                                    placeholder="Select arrival time"
                                />
                                <FormDescription>
                                    Expected arrival time
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Base Price */}
                    <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Base Price ($)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        disabled={isLoading}
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Base ticket price for this trip
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Status */}
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="delayed">Delayed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Current status of the trip
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Trip
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
