"use client";

import Timeline from "@/components/Timeline";
import TaskInput from "@/components/TaskInput";
import StatsPanel from "@/components/StatsPanel";
import WeeklyTabs from '@/components/WeeklyTabs';
import CategoryTabs from '@/components/CategoryTabs';
import DailyPlanWizard from '@/components/DailyPlanWizard';
import DailySummaryWizard from '@/components/DailySummaryWizard';
// import LifeHappenedModal from "@/components/LifeHappenedModal"; // Temporarily removed to ensure stability
import { useStore } from "@/lib/store";
import { Plus } from 'lucide-react';
import { useState, useMemo, useEffect } from "react";

import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function TasksPage() {
    const { tasks, scheduleTasks, selectedDate, activeCategoryFilter, dayStatus, editingTaskId, setEditingTask, fetchTasks } = useStore();
    const [isInputOpen, setIsInputOpen] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const todayStr = new Date().toISOString().split('T')[0];
    const displayDate = selectedDate || todayStr;

    // Derived Logic with Safety
    const processedTasks = useMemo(() => {
        try {
            return tasks.filter(t => {
                const isDateMatch = t.scheduledDate ? t.scheduledDate === displayDate : displayDate === todayStr;
                if (!isDateMatch) return false;

                // Safety check for category
                if (!activeCategoryFilter) return true;

                if (activeCategoryFilter === 'overview') return true;
                if (activeCategoryFilter === 'reminders') return t.type === 'reminder';
                if (activeCategoryFilter !== 'all') {
                    if ((t.category || 'other') !== activeCategoryFilter) return false;
                }
                // Filter out Quick Focus sessions
                if (t.type === 'focus' as any) return false;

                return true;
            }).sort((a, b) => {
                // Sort logic
                if (a.completed && !b.completed) return -1;
                if (!a.completed && b.completed) return 1;
                if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
                if (a.startTime) return -1;
                if (b.startTime) return 1;
                return 0;
            });
        } catch (e) {
            console.error("Error processing tasks", e);
            return [];
        }
    }, [tasks, displayDate, activeCategoryFilter, todayStr]);

    const editingTask = useMemo(() => tasks.find(t => t.id === editingTaskId), [tasks, editingTaskId]);

    return (
        <ErrorBoundary componentName="TasksPage">
            <div className="p-6 md:p-8 flex flex-col items-center min-h-screen relative overflow-x-hidden">

                {/* Background Atmosphere */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 dark:bg-purple-900/10" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 dark:bg-indigo-900/10" />
                </div>

                {/* FAILSAFE INDICATOR */}
                <div className="fixed top-0 left-0 bg-green-500 text-white text-xs px-2 py-1 z-[99999] opacity-50 pointer-events-none">
                    System Active | Tasks: {tasks.length}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-[1800px] relative z-10">
                    {/* Main Area: Timeline */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                        {/* Glass Header Panel */}
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 p-6 rounded-3xl shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                        הלו"ז שלי
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                                        {tasks.length > 0 ? `יש לך ${tasks.filter(t => !t.completed && t.type !== 'focus').length} משימות להיום` : 'היומן נקי!'}
                                    </p>
                                </div>
                                <WeeklyTabs />
                            </div>
                            <CategoryTabs />
                        </div>

                        {/* Timeline */}
                        <div className="pr-1 pl-1">
                            <ErrorBoundary componentName="Timeline">
                                <Timeline tasks={processedTasks} />
                            </ErrorBoundary>
                        </div>
                    </div>

                    {/* Sidebar Area: Input & Stats */}
                    <div className="md:col-span-4 flex flex-col gap-4 md:gap-6">
                        {/* Collapsible Task Input */}
                        {isInputOpen ? (
                            <div className="animate-in slide-in-from-top-10 fade-in duration-300">
                                <TaskInput onClose={() => setIsInputOpen(false)} />
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsInputOpen(true)}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                <Plus size={20} />
                                הוסף משימה חדשה
                            </button>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            {dayStatus === 'planning' && <DailyPlanWizard />}
                            <DailySummaryWizard />

                            {/* REMOVED LifeHappenedModal for now */}

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                {/* Optional bottom content */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty State / Filter Reset Helper */}
                {processedTasks.length === 0 && tasks.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-10 fade-in">
                        <span>לא רואים משימות?</span>
                        <button
                            onClick={() => useStore.getState().setCategoryFilter('all')}
                            className="font-bold underline text-indigo-300 hover:text-indigo-200"
                        >
                            נקה סינונים
                        </button>
                    </div>
                )}

                {/* DEBUG INFO BAR (Temporary) */}
                <div className="fixed bottom-0 right-0 bg-yellow-100 text-xs p-2 opacity-50 hover:opacity-100 z-[9999] text-black">
                    DEBUG: Tasks={tasks.length}, Processed={processedTasks.length}, Date={displayDate}, Filter={activeCategoryFilter}
                </div>

                {/* Edit Task Modal Global Logic can be here too or standard logic*/}
                {editingTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                            <TaskInput
                                initialData={editingTask}
                                onClose={() => setEditingTask(null)}
                            />
                        </div>
                    </div>
                )}

            </div>
        </ErrorBoundary>
    );
}
