"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    label?: string;
    className?: string;
}

const getSafeTimeValue = (date: Date | undefined, type: 'hours' | 'minutes'): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return '00';
    }
    const value = type === 'hours' ? date.getHours() : date.getMinutes();
    return String(value).padStart(2, '0');
};

export function TimePicker({ date, setDate, label, className }: TimePickerProps) {
    const [hours, setHours] = React.useState<string>(getSafeTimeValue(date, 'hours'));
    const [minutes, setMinutes] = React.useState<string>(getSafeTimeValue(date, 'minutes'));

    React.useEffect(() => {
        setHours(getSafeTimeValue(date, 'hours'));
        setMinutes(getSafeTimeValue(date, 'minutes'));
    }, [date]);

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Append new character and take last 2 digits
        const newValue = value.length > 2 ? value.slice(-2) : value;
        if (newValue === "" || (/^\d{0,2}$/.test(newValue) && parseInt(newValue) <= 23)) {
            setHours(newValue);
            updateDateTime(newValue, minutes);
        }
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Append new character and take last 2 digits
        const newValue = value.length > 2 ? value.slice(-2) : value;
        if (newValue === "" || (/^\d{0,2}$/.test(newValue) && parseInt(newValue) <= 59)) {
            setMinutes(newValue);
            updateDateTime(hours, newValue);
        }
    };

    const updateDateTime = (h: string, m: string) => {
        if (h && m) {
            const newDate = date ? new Date(date) : new Date();
            newDate.setHours(parseInt(h) || 0);
            newDate.setMinutes(parseInt(m) || 0);
            setDate(newDate);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <Label>{label}</Label>}
            <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="HH"
                    value={hours}
                    onChange={handleHoursChange}
                    onBlur={() => {
                        if (hours && hours.length === 1) {
                            setHours(hours.padStart(2, "0"));
                        }
                    }}
                    className="w-16 text-center"
                />
                <span className="text-muted-foreground">:</span>
                <Input
                    type="text"
                    placeholder="MM"
                    value={minutes}
                    onChange={handleMinutesChange}
                    onBlur={() => {
                        if (minutes && minutes.length === 1) {
                            setMinutes(minutes.padStart(2, "0"));
                        }
                    }}
                    className="w-16 text-center"
                />
            </div>
        </div>
    );
}
