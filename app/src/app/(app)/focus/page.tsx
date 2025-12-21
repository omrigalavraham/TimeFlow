"use client";

import { useStore } from "@/lib/store";
import { Play, Zap, Brain, Coffee, BarChart3 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FocusPage() {
    const { activeTaskId, setActiveTask, tasks, addTask } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate Today's Focus Stats
    const todayStats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => t.completed && t.scheduledDate === todayStr);
        const totalMinutes = todayTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);
        return { count: todayTasks.length, minutes: totalMinutes };
    }, [tasks]);

    const handleQuickStart = (type: 'pomodoro' | 'deep' | 'blitz') => {
        const presets = {
            pomodoro: { title: 'סשן פודמודורו', duration: 25, icon: '🍅' },
            deep: { title: 'עבודה עמוקה', duration: 90, icon: '🧠' },
            blitz: { title: 'בליץ מהיר', duration: 15, icon: '⚡' }
        };

        const preset = presets[type];

        // Create a temporary task for this session
        const newTaskId = crypto.randomUUID();
        const newTask = {
            id: newTaskId,
            title: `${preset.icon} ${preset.title}`,
            description: 'סשן פוקוס מהיר',
            status: 'todo' as const,
            priority: 'medium' as 'medium', // Explicit cast
            scheduledDate: new Date().toISOString().split('T')[0],
            duration: preset.duration,
            createdAt: new Date().toISOString(),
            completed: false,
            category: 'focus' as any, // Cast to any or valid Category if 'focus' is not in enum
            // groupId: 'quick-focus', // Removed to avoid UUID error as this is not a valid UUID
            type: 'focus' as const // Now valid
        };

        // We need to add it to store first. 
        // Note: 'addTask' might need updating if type signature is strict, avoiding direct store mutation here is best but standard 'addTask' should work.
        // Assuming strict store, we might need a distinct action or just use addTask.
        // We need to add it to store first. 
        const createdId = addTask(newTask);
        setActiveTask(createdId);
    };

    if (!mounted) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 max-w-5xl mx-auto w-full">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="inline-block p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 mb-4 animate-pulse">
                        <Brain size={48} />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight">
                        אזור המיקוד
                    </h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                        העולם רועש. כאן שקט. בחר את המצב שלך והתחל ליצור.
                    </p>
                </motion.div>

                {/* Presets Grid */}
                {!activeTaskId ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <motion.button
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleQuickStart('pomodoro')}
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-red-400 dark:hover:border-red-500 group transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/10 transition-colors" />
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🍅</div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">פומודורו</h3>
                            <p className="text-slate-500 mb-6 min-h-[48px]">סשן קלאסי של 25 דקות. מעולה למשימות שגרתיות.</p>
                            <div className="flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 dark:bg-red-900/20 py-3 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <Play size={18} fill="currentColor" /> התחל (25 דק')
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleQuickStart('deep')}
                            className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 group transition-all relative overflow-hidden transform md:scale-110 z-10"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="text-4xl mb-4 group-hover:rotate-12 transition-transform duration-300">🧠</div>
                            <h3 className="text-2xl font-black mb-2">Deep Work</h3>
                            <p className="text-indigo-100 mb-6 min-h-[48px]">צלילה עמוקה של 90 דקות. לבעיות מורכבות ויצירה.</p>
                            <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold bg-white py-3 rounded-xl hover:bg-slate-50 transition-colors">
                                <Play size={18} fill="currentColor" /> התחל (90 דק')
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleQuickStart('blitz')}
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-amber-400 dark:hover:border-amber-500 group transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 group-hover:bg-amber-500/10 transition-colors" />
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">בליץ</h3>
                            <p className="text-slate-500 mb-6 min-h-[48px]">15 דקות מהירות לניקוי שולחן וסגירת פינות.</p>
                            <div className="flex items-center justify-center gap-2 text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 py-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <Play size={18} fill="currentColor" /> התחל (15 דק')
                            </div>
                        </motion.button>
                    </div>
                ) : (
                    <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 rounded-3xl animate-pulse w-full max-w-xl">
                        <div className="text-2xl font-bold mb-2">מצב פוקוס פעיל 🚀</div>
                        <p>המוזה שורה עליך... אצלנו שומרים על השקט.</p>
                    </div>
                )}

                {/* Daily Stats Footer */}
                <div className="w-full max-w-4xl border-t border-slate-200 dark:border-slate-800 pt-12 flex flex-col md:flex-row items-center justify-between gap-8 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                            <BarChart3 className="text-slate-400" />
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-slate-800 dark:text-white tabular-nums">{todayStats.minutes}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">דקות פוקוס היום</div>
                        </div>
                    </div>

                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-sm">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${Math.min((todayStats.minutes / 180) * 100, 100)}%` }} // Goal: 3 hours
                        />
                    </div>

                    <div className="text-sm font-medium text-slate-500">
                        היעד היומי: 3 שעות ({Math.round((todayStats.minutes / 180) * 100)}%)
                    </div>
                </div>
            </div>
        </div>
    );
}
