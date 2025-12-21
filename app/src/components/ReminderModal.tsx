"use client";

import { useEffect, useState } from 'react';
import { Task, useStore } from '@/lib/store';
import { Bell, X, Clock, ExternalLink, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface ReminderModalProps {
    task: Task;
    onClose: () => void;
    onSnooze: (minutes: number) => void;
    onComplete: () => void;
}

export default function ReminderModal({ task, onClose, onSnooze, onComplete }: ReminderModalProps) {
    const [snoozeOpen, setSnoozeOpen] = useState(false);

    // Sound effect on mount
    useEffect(() => {
        if (task.sound && task.sound !== 'none') {
            // Placeholder for real sound
            // const audio = new Audio('/sounds/bell.mp3');
            // audio.play().catch(e => console.log('Audio play failed', e));
            console.log(`Playing sound: ${task.sound}`);
        }
    }, [task.sound]);

    const handleComplete = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-amber-100 dark:bg-amber-900/30 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 animate-gradient" />

                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce">
                        <Bell size={32} className="text-amber-500" />
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">תזכורת!</h2>
                    <p className="text-slate-600 dark:text-slate-300 font-medium text-lg text-balance">{task.title}</p>

                    <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {task.actionLink && (
                        <a
                            href={task.actionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all group"
                        >
                            <ExternalLink size={20} className="group-hover:scale-110 transition-transform" />
                            פתח קישור לפעולה
                        </a>
                    )}

                    {!snoozeOpen ? (
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSnoozeOpen(true)}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-slate-600 dark:text-slate-400 group"
                            >
                                <Clock size={24} className="group-hover:rotate-12 transition-transform" />
                                <span className="font-bold">הזכר לי אח"כ</span>
                            </button>

                            <button
                                onClick={handleComplete}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 shadow-lg hover:shadow-xl transition-all group"
                            >
                                <CheckCircle size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold">תודה, בוצע!</span>
                            </button>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-5 fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700 dark:text-slate-300">בחר זמן נודניק:</h3>
                                <button onClick={() => setSnoozeOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">ביטול</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => onSnooze(10)} className="py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">עוד 10 דקות</button>
                                <button onClick={() => onSnooze(30)} className="py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">עוד 30 דקות</button>
                                <button onClick={() => onSnooze(60)} className="py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">עוד שעה</button>
                                <button onClick={() => onSnooze(1440)} className="py-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">מחר</button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
