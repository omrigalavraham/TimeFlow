"use client";

import { useStore } from '@/lib/store';
import { BentoGrid, BentoItem } from './dashboard/BentoGrid';
import { FocusWidget } from './dashboard/FocusWidget';
import { StatsWidget } from './dashboard/StatsWidget';
import { StudyProgressWidget } from './dashboard/StudyProgressWidget';
import { AssignmentsWidget } from './dashboard/AssignmentsWidget';
import { Calendar, Sun, GraduationCap } from 'lucide-react';
import { useState, useMemo } from 'react';
import StrategicCalendar from './StrategicCalendar';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface HorizonViewProps {
    onOpenStudyHub?: () => void;
}

export default function HorizonView({ onOpenStudyHub }: HorizonViewProps) {
    const { tasks } = useStore();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Dynamic greeting based on hour
    const hour = new Date().getHours();
    const greeting = useMemo(() => {
        if (hour < 5) return "לילה טוב";
        if (hour < 12) return "בוקר טוב";
        if (hour < 17) return "צהריים טובים";
        if (hour < 21) return "ערב טוב";
        return "לילה טוב";
    }, [hour]);

    const quote = useMemo(() => {
        const quotes = [
            "הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.",
            "הצלחה היא סך כל המאמצים הקטנים שנעשים יום אחר יום.",
            "אל תחכה להזדמנות, צור אותה.",
            "הזמן הכי טוב לשתול עץ היה לפני 20 שנה. הזמן השני הכי טוב הוא עכשיו.",
            "העתיד שייך לאלו המאמינים ביופי של החלומות שלהם."
        ];
        // Day-based rotation
        const dayIndex = new Date().getDate() % quotes.length;
        return quotes[dayIndex];
    }, []);

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50">
            {/* Header */}
            <header className="p-6 md:p-8 pb-4">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-1">
                            <Sun size={14} className={cn("text-amber-500", hour >= 6 && hour < 18 ? "opacity-100" : "opacity-0")} />
                            <span>{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-500 to-purple-600">עומרי</span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium italic opacity-80">
                            "{quote}"
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 group"
                    >
                        <Calendar size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="hidden md:inline font-bold text-sm">זמן אסטרטגי</span>
                    </button>
                </div>
            </header>

            {/* Main Grid Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-2">
                <BentoGrid>
                    {/* 1. Main Focus (Large, 2x2) */}
                    <BentoItem colSpan={2} rowSpan={2} className="min-h-[300px]">
                        <FocusWidget />
                    </BentoItem>

                    {/* 2. Upcoming Assignments (1x2) - Visible on right/left of focus */}
                    <BentoItem rowSpan={2} className="min-h-[300px]">
                        <AssignmentsWidget />
                    </BentoItem>

                    {/* 3. Stats (1x1) */}
                    <BentoItem>
                        <StatsWidget />
                    </BentoItem>

                    {/* 3. Study Progress (1x1) */}
                    <BentoItem>
                        <StudyProgressWidget />
                    </BentoItem>

                </BentoGrid>
            </div>

            {/* Calendar Modal Overlay */}
            <AnimatePresence>
                {isCalendarOpen && (
                    <StrategicCalendar
                        onClose={() => setIsCalendarOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
