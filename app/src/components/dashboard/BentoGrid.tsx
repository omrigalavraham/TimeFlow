"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
    children: ReactNode;
    className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px]", className)}>
            {children}
        </div>
    );
}

export function BentoItem({ children, className, colSpan = 1, rowSpan = 1 }: { children: ReactNode, className?: string, colSpan?: number, rowSpan?: number }) {
    return (
        <div className={cn(
            "bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative",
            colSpan === 2 && "md:col-span-2",
            colSpan === 3 && "md:col-span-3",
            rowSpan === 2 && "row-span-2",
            className
        )}>
            {children}
        </div>
    );
}
