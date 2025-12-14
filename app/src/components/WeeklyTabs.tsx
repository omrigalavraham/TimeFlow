"use client";

import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function WeeklyTabs() {
    const { selectedDate, setSelectedDate } = useStore();

    // State to track navigation offset (weeks)
    // Actually, user wants "Next 7 days" usually, or a static week view.
    // Let's do a scrolling view of 7 days starting from a base date.
    // We default to "Today" being the first or center? User said "Tabs for each day".
    // Let's show: Yesterday | Today | Tomorrow | Next...

    const [baseDate, setBaseDate] = useState(new Date());

    useEffect(() => {
        // Reset base to selected date if it drifts too far? 
        // Or just keep baseDate as "Start of View"
    }, []);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 5 days starting from baseDate (or maybe -1 to +5)
    // Let's allow simple scrolling or just static 7 days.
    // User request: "Tab for each day of the week".
    // Hebrew weeks usually start Sunday. 

    // Let's try giving 7 days ahead starting from Today for now.
    for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(today.getDate() + i);
        days.push(d);
    }

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getDayName = (date: Date) => {
        return date.toLocaleDateString('he-IL', { weekday: 'long' });
    };

    const getDayNumber = (date: Date) => {
        return date.getDate();
    };

    const isToday = (date: Date) => {
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max px-1">
                {days.map((date) => {
                    const dateStr = formatDate(date);
                    const isSelected = selectedDate === dateStr;
                    const isTodayDate = isToday(date);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[4.5rem] py-3 rounded-2xl transition-all border",
                                isSelected
                                    ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20 scale-100 ring-2 ring-purple-100 dark:ring-purple-900"
                                    : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-500",
                                isTodayDate && !isSelected && "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10"
                            )}
                        >
                            <span className={cn("text-xs font-medium", isSelected ? "text-purple-100" : isTodayDate ? "text-purple-600" : "text-slate-400")}>
                                {isTodayDate ? 'היום' : getDayName(date)}
                            </span>
                            <span className={cn("text-xl font-bold font-mono", isSelected ? "text-white" : "text-slate-800 dark:text-slate-200")}>
                                {getDayNumber(date)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
