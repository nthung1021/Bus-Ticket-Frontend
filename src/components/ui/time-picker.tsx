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

export function TimePicker({ date, setDate, label, className }: TimePickerProps) {
    const [hours, setHours] = React.useState<string>(
        date ? String(date.getHours()).padStart(2, "0") : "00"
    );
    const [minutes, setMinutes] = React.useState<string>(
        date ? String(date.getMinutes()).padStart(2, "0") : "00"
    );

    React.useEffect(() => {
        if (date) {
            setHours(String(date.getHours()).padStart(2, "0"));
            setMinutes(String(date.getMinutes()).padStart(2, "0"));
        }
    }, [date]);

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (/^\d{0,2}$/.test(value) && parseInt(value) <= 23)) {
            setHours(value);
            updateDateTime(value, minutes);
        }
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (/^\d{0,2}$/.test(value) && parseInt(value) <= 59)) {
            setMinutes(value);
            updateDateTime(hours, value);
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
                    maxLength={2}
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
                    maxLength={2}
                />
            </div>
        </div>
    );
}
