"use client";

import { useStore, Category } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Briefcase, BookOpen, Home, Activity, Heart, MoreHorizontal, LayoutGrid, Bell, Compass } from 'lucide-react';

export const CATEGORY_CONFIG: Record<Category | 'all' | 'reminders' | 'overview', { label: string; icon: any; color: string }> = {
    'overview': { label: 'סקירה', icon: Compass, color: 'text-indigo-600 bg-indigo-100' },
    'all': { label: 'הכל', icon: LayoutGrid, color: 'text-slate-600 bg-slate-100' },
    'reminders': { label: 'תזכורות', icon: Bell, color: 'text-amber-600 bg-amber-100' },
    'work': { label: 'עבודה', icon: Briefcase, color: 'text-purple-600 bg-purple-100' },
    'study': { label: 'לימודים', icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
    'home': { label: 'בית', icon: Home, color: 'text-orange-600 bg-orange-100' },
    'health': { label: 'בריאות', icon: Activity, color: 'text-green-600 bg-green-100' },
    'social': { label: 'חברתי', icon: Heart, color: 'text-red-600 bg-red-100' },
    'other': { label: 'שונות', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-100' },
};

export default function CategoryTabs() {
    const { activeCategoryFilter, setCategoryFilter } = useStore();

    const categories: (Category | 'all' | 'reminders' | 'overview')[] = [
        'overview',
        'all',
        'reminders',
        'work',
        'study',
        'home',
        'health',
        'social',
        'other'
    ];

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
            {categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const Icon = config.icon;
                const isActive = activeCategoryFilter === cat;

                return (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                            isActive
                                ? "border-transparent shadow-sm scale-105"
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50",
                            isActive && config.color
                        )}
                    >
                        <Icon size={14} />
                        {config.label}
                    </button>
                );
            })}
        </div>
    );
}
