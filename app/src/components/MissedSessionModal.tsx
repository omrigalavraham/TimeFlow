"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AlertCircle, Calendar, ArrowRight, X, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MissedSessionModal() {
    const { tasks, handleRescheduleMissed } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [missedTasks, setMissedTasks] = useState<any[]>([]);

    useEffect(() => {
        // Detect missed study tasks
        const today = new Date().toISOString().split('T')[0];
        const missed = tasks.filter(t =>
            t.category === 'study' &&
            !t.completed &&
            t.scheduledDate < today &&
            // Ensure it's not too old (e.g., last 30 days) to avoid overwhelming legacy data
            t.scheduledDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        );

        if (missed.length > 0) {
            setMissedTasks(missed);
            setIsOpen(true);
        }
    }, [tasks]);

    const handleAction = (action: 'spread' | 'move_today' | 'dismiss') => {
        if (handleRescheduleMissed) {
            handleRescheduleMissed(missedTasks.map(t => t.id), action);
        }
        setIsOpen(false);
    };

    if (!isOpen) return null;

    const totalMinutes = missedTasks.reduce((acc, t) => acc + t.duration, 0);
    const uniqueSubjects = Array.from(new Set(missedTasks.map(t => t.title.replace('🏆 ', '').replace('📚 למידה: ', ''))));

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-purple-100 dark:border-purple-900"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain size={120} />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-1">היי, פספסנו קצת?</h2>
                            <p className="text-purple-100 text-sm">המערכת זיהתה {missedTasks.length} סשנים שלא הושלמו.</p>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="text-purple-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                                    {totalMinutes} דקות לימוד חסרות
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    בנושאים: {uniqueSubjects.join(', ')}
                                </p>
                            </div>
                        </div>

                        <h4 className="text-sm font-medium text-slate-500 mb-3">איך תרצה להשלים את הפער?</h4>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleAction('spread')}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-4 rounded-xl flex items-center gap-4 transition-all group text-right"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <ArrowRight size={20} className="rotate-45" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">פזר את זה</div>
                                    <div className="text-xs text-slate-500">חלק את הזמן שווה בשווה בימים הקרובים</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAction('move_today')}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-4 rounded-xl flex items-center gap-4 transition-all group text-right"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Calendar size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">עבור להיום</div>
                                    <div className="text-xs text-slate-500">הוסף את הכל ללו"ז של היום (קשוח!)</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleAction('dismiss')}
                                className="w-full p-2 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1"
                            >
                                <X size={14} /> לוותר הפעם (סמן כהושלם)
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
