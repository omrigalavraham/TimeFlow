"use client";

import { useStore, Task } from '@/lib/store';
import { useMemo } from 'react';
import { Rocket, Clock, AlertTriangle, CheckCircle2, MoreHorizontal, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AssignmentsWidget() {
    const tasks = useStore(s => s.tasks);

    // 1. Find all "Project" roots (Assignments)
    const assignments = useMemo(() => {
        const roots = tasks.filter(t => t.type === 'project' && !t.completed);

        return roots.map(root => {
            // Find related subtasks by groupId
            const subtasks = tasks.filter(t => t.groupId === root.groupId && t.id !== root.id);
            const total = subtasks.length;
            const completed = subtasks.filter(t => t.completed).length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Calculate Urgency
            const today = new Date();
            const due = new Date(root.scheduledDate);
            const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

            // Urgency Score: (Low Days + Low Progress) = High Urgency
            // Simple logic:
            // Critical: < 3 days left & < 50% progress
            // Warning: < 7 days left
            // Normal: else
            let status: 'normal' | 'warning' | 'critical' = 'normal';
            if (daysLeft <= 3 && progress < 80) status = 'critical';
            else if (daysLeft <= 7 && progress < 100) status = 'warning';

            return {
                ...root,
                progress,
                daysLeft,
                status,
                subtaskCount: total
            };
        }).sort((a, b) => {
            // Sort by Urgency (Critical first), then Date
            const scoreA = a.status === 'critical' ? 3 : a.status === 'warning' ? 2 : 1;
            const scoreB = b.status === 'critical' ? 3 : b.status === 'warning' ? 2 : 1;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return a.scheduledDate.localeCompare(b.scheduledDate);
        });
    }, [tasks]);

    if (assignments.length === 0) {
        return (
            <div className="h-full p-5 flex flex-col items-center justify-center text-center relative bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500 mb-3">
                    <Rocket size={24} />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200">הלוח נקי!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">אין הגשות קרובות באופק. זה הזמן לנוח.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Rocket size={18} className="text-indigo-500" />
                    הגשות קרובות
                </h3>
                <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded-full">
                    {assignments.length} פעיל
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {assignments.map(assignment => (
                    <div key={assignment.id} className="relative group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-shadow">

                        {/* Status Strip */}
                        <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-colors",
                            assignment.status === 'critical' ? "bg-red-500 animate-pulse" :
                                assignment.status === 'warning' ? "bg-orange-400" :
                                    "bg-slate-200 dark:bg-slate-700"
                        )} />

                        <div className="flex justify-between items-start mb-2 pl-3">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-1" title={assignment.title}>
                                    {assignment.title.replace('🏁 הגשה: ', '')}
                                </h4>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                    <span className={cn(
                                        "flex items-center gap-1 font-medium",
                                        assignment.daysLeft <= 3 ? "text-red-500" : "text-slate-500"
                                    )}>
                                        <Clock size={12} />
                                        {assignment.daysLeft < 0 ? 'באיחור!' : assignment.daysLeft === 0 ? 'היום!' : `עוד ${assignment.daysLeft} ימים`}
                                    </span>
                                    <span>•</span>
                                    <span>{assignment.subtaskCount} שלבים</span>
                                </div>
                            </div>

                            {/* Urgent Badge */}
                            {assignment.status === 'critical' && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-1.5 rounded-lg">
                                    <AlertTriangle size={16} />
                                </div>
                            )}
                        </div>

                        {/* Progress */}
                        <div className="space-y-1 pl-3">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                <span>התקדמות</span>
                                <span>{assignment.progress}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        assignment.status === 'critical' ? "bg-red-500" :
                                            assignment.progress === 100 ? "bg-emerald-500" :
                                                "bg-indigo-500"
                                    )}
                                    style={{ width: `${assignment.progress}%` }}
                                />
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                <button
                    onClick={() => {/* Navigate to All Projects? */ }}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1 transition-colors"
                >
                    לכל הפרויקטים <ArrowRight size={12} />
                </button>
            </div>
        </div>
    );
}
