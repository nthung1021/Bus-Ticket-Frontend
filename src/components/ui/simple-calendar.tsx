"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";

export type CalendarProps = {
    date?: Date;
    onSelect?: (date: Date | undefined) => void;
    className?: string;
    showOutsideDays?: boolean;
};

export function SimpleCalendar({
    date,
    onSelect,
    className,
    showOutsideDays = true,
}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(date || new Date());
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const startDayOfWeek = getDay(monthStart);
    const previousMonthDays = showOutsideDays 
        ? eachDayOfInterval({ 
            start: new Date(monthStart.getFullYear(), monthStart.getMonth(), -startDayOfWeek + 1), 
            end: new Date(monthStart.getFullYear(), monthStart.getMonth(), 0) 
          })
        : [];
    
    const endDayOfWeek = getDay(monthEnd);
    const nextMonthDays = showOutsideDays
        ? eachDayOfInterval({ 
            start: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + 1), 
            end: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + (6 - endDayOfWeek)) 
          })
        : [];

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };
    
    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };
    
    const handleDayClick = (day: Date) => {
        if (onSelect) {
            onSelect(day);
        }
    };

    return (
        <div className={cn("p-3", className)}>
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handlePreviousMonth}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                    )}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-sm font-medium">
                    {format(currentMonth, "MMMM yyyy")}
                </div>
                <button
                    onClick={handleNextMonth}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                    )}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
            
            <div className="flex w-full justify-between mb-2">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center"
                    >
                        {day}
                    </div>
                ))}
            </div>
            
            <div className="flex flex-col space-y-1">
                {Array.from({ length: Math.ceil((previousMonthDays.length + monthDays.length + nextMonthDays.length) / 7) }).map((_, weekIndex) => (
                    <div key={weekIndex} className="flex w-full justify-between">
                        {Array.from({ length: 7 }).map((_, dayIndex) => {
                            const totalDays = previousMonthDays.length + monthDays.length + nextMonthDays.length;
                            const dayNumber = weekIndex * 7 + dayIndex;
                            
                            let day: Date | null = null;
                            let isOutside = false;
                            
                            if (dayNumber < previousMonthDays.length) {
                                day = previousMonthDays[dayNumber];
                                isOutside = true;
                            } else if (dayNumber < previousMonthDays.length + monthDays.length) {
                                day = monthDays[dayNumber - previousMonthDays.length];
                            } else if (dayNumber < totalDays) {
                                day = nextMonthDays[dayNumber - previousMonthDays.length - monthDays.length];
                                isOutside = true;
                            }
                            
                            if (!day) return <div key={dayIndex} className="w-9" />;
                            
                            const isSelected = date && isSameDay(day, date);
                            const isTodayDate = isToday(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            
                            return (
                                <button
                                    key={dayIndex}
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                        buttonVariants({ variant: "ghost" }),
                                        "h-9 w-9 p-0 font-normal",
                                        isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                                        // isTodayDate && !isSelected && "bg-accent text-accent-foreground",
                                        !isCurrentMonth && !isSelected && "text-muted-foreground opacity-50",
                                        isSelected && "aria-selected:opacity-100"
                                    )}
                                    disabled={!isCurrentMonth && !showOutsideDays}
                                >
                                    {format(day, "d")}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

SimpleCalendar.displayName = "SimpleCalendar";
