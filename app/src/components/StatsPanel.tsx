"use client";

import { useStore } from '@/lib/store';
import { PieChart, Trophy, Target } from 'lucide-react';
import { useMemo } from 'react';

const getProgressColors = (p: number) => {
    if (p === 100) return {
        bar: "bg-green-500 shadow-green-500/50",
        text: "text-green-600 dark:text-green-400",
        track: "bg-green-100 dark:bg-green-900/30",
        badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
    };
    if (p >= 66) return {
        bar: "bg-blue-500 shadow-blue-500/50",
        text: "text-blue-600 dark:text-blue-400",
        track: "bg-blue-100 dark:bg-blue-900/30",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
    };
    if (p >= 33) return {
        bar: "bg-amber-500 shadow-amber-500/50",
        text: "text-amber-600 dark:text-amber-400",
        track: "bg-amber-100 dark:bg-amber-900/30",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
    };
    return {
        bar: "bg-purple-500 shadow-purple-500/50",
        text: "text-purple-600 dark:text-purple-400",
        track: "bg-purple-100 dark:bg-purple-900/30",
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
    };
};

export default function StatsPanel() {
    const tasks = useStore((state) => state.tasks);
    const selectedDate = useStore((state) => state.selectedDate);

    // Filter for current day AND type 'task' (exclude breaks)
    const dailyTasks = useMemo(() => tasks.filter(t =>
        (t.scheduledDate === selectedDate || (!t.scheduledDate && new Date().toISOString().split('T')[0] === selectedDate))
        && t.type !== 'break'
    ), [tasks, selectedDate]);

    const stats = useMemo(() => {
        const total = dailyTasks.length;
        const completed = dailyTasks.filter(t => t.completed).length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
        const estimatedMinutes = dailyTasks.reduce((acc, t) => acc + (t.completed ? 0 : t.duration), 0);

        return {
            total,
            completed,
            progress,
            hoursLeft: Math.floor(estimatedMinutes / 60),
            minutesLeft: estimatedMinutes % 60
        };
    }, [dailyTasks]);

    const colors = getProgressColors(stats.progress);

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6 transition-colors">
            <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <PieChart className={colors.text} size={20} /> סקירה יומית
            </h2>

            {/* Progress Circle */}
            <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                    <div className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${colors.badge}`}>
                        התקדמות
                    </div>
                    <div className="text-right">
                        <span className={`text-xs font-semibold inline-block ${colors.text}`}>
                            {stats.progress}%
                        </span>
                    </div>
                </div>
                <div className={`overflow-hidden h-2 mb-4 text-xs flex rounded ${colors.track}`}>
                    <div style={{ width: `${stats.progress}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ${colors.bar}`}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg text-center">
                    <Trophy className="mx-auto text-yellow-500 mb-1" size={20} />
                    <div className="text-2xl font-bold text-foreground">{stats.completed}/{stats.total}</div>
                    <div className="text-xs text-muted-foreground">הושלמו</div>
                </div>
                <div className="bg-muted p-3 rounded-lg text-center">
                    <Target className="mx-auto text-blue-500 mb-1" size={20} />
                    <div className="text-xl font-bold text-foreground" dir="ltr">{stats.hoursLeft}h {stats.minutesLeft}m</div>
                    <div className="text-xs text-muted-foreground">זמן שנותר</div>
                </div>
            </div>
        </div>
    );
}
