"use client";

import * as React from "react";
import { SimpleCalendar } from "@/components/ui/simple-calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DateTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

export function DateTimePicker({
    date,
    setDate,
    label,
    placeholder = "Pick a date and time",
    className,
}: DateTimePickerProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal truncate",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MMM d, yyyy HH:mm") : <span>{placeholder}</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 space-y-3">
                        <SimpleCalendar
                            date={date}
                            onSelect={setDate}
                            showOutsideDays={false}
                        />
                        <div className="border-t pt-3">
                            <TimePicker date={date} setDate={setDate} />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
