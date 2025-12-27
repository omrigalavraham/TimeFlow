"use client";

import { useStore, Task } from '@/lib/store';
import { useMemo } from 'react';
import { Play, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FocusWidget() {
    // OPTIMIZED: Select only the computed focus task directly from the store
    // This prevents re-renders when other unrelated tasks change
    const focusTask = useStore(state => {
        const today = new Date().toISOString().split('T')[0];
        let t = state.tasks.find(t => t.scheduledDate === today && t.priority === 'must' && !t.completed && t.type !== 'break');
        if (!t) t = state.tasks.find(t => t.scheduledDate === today && !t.completed && t.type !== 'break');
        return t;
    });

    const toggleTaskCompletion = useStore(s => s.toggleTaskCompletion);
    const setActiveTask = useStore(s => s.setActiveTask);
    const setDayStatus = useStore(s => s.setDayStatus);

    const handleStartTask = () => {
        if (!focusTask) return;
        setActiveTask(focusTask.id);
        setDayStatus('active'); // Ensure we are in active mode
        // Optionally trigger global Focus Mode overlay if needed?
        // For now, just setting active task usually highlights it or shows the timer widget if distinct.
    };

    if (!focusTask) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm">
                <div className="p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-full animate-bounce">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">הכל נקי להיום!</h3>
                    <p className="text-slate-500 text-sm mt-1">אין משימות דחופות. זה הזמן לנוח או ללמוד משהו חדש.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full p-6 flex flex-col relative overflow-hidden group">
            {/* Rich Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold ring-1 ring-indigo-500/20 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            הפוקוס שלך עכשיו
                        </span>

                        {/* Snooze Button */}
                        <button
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="דחה לאחר כך"
                            onClick={(e) => { e.stopPropagation(); /* Logic to defer? */ }}
                        >
                            <ClockIcon duration={0} /> {/* Placeholder for Snooze Icon */}
                        </button>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                        {focusTask.title}
                    </h2>

                    <div className="flex items-center gap-2 mt-3 text-slate-500 dark:text-slate-400">
                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold flex items-center gap-1">
                            <ClockIcon duration={focusTask.duration} />
                            {focusTask.duration} דקות
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleStartTask}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200/50 dark:shadow-none hover:shadow-indigo-500/30 hover:-translate-y-0.5 group/btn"
                    >
                        <Play size={20} fill="currentColor" className="group-hover/btn:scale-110 transition-transform" />
                        <span className="tracking-wide">התחל לעבוד</span>
                    </button>

                    <button
                        onClick={() => toggleTaskCompletion(focusTask.id)}
                        className="p-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-slate-400 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800 group/check"
                        title="סמן כהושלם"
                    >
                        <CheckCircle2 size={22} className="group-hover/check:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function ClockIcon({ duration }: { duration: number }) {
    // Simple visual flair based on duration
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
        </svg>
    )
}
