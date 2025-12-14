"use client";

import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { X, Clock, Play, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

export default function TaskCompletionModal() {
    const { completionData, closeCompletionModal, updateTask, toggleTaskCompletion, streak, tasks } = useStore();
    const [step, setStep] = useState<'input' | 'feedback'>('input');
    const [durationInput, setDurationInput] = useState('');

    // Reset state when modal completionId changes
    useEffect(() => {
        if (!completionData) {
            setStep('input');
            setDurationInput('');
            return;
        }

        // Use getState to avoid dependency on 'tasks' changing (which happens when we complete it!)
        const currentTasks = useStore.getState().tasks;
        const task = currentTasks.find(t => t.id === completionData.taskId);

        // If we already have elapsedTime (from Focus Mode) OR task is already completed (viewing summary?)
        // Or if we just want to skip input for some reason?
        // Actually, if coming from FocusMode, elapsedTime is passed.
        if (completionData.elapsedTime !== undefined) {
            setStep('feedback');
            // We assume 'updateTask' was called by FocusMode already? 
            // Or we do it here? FocusMode said "handleComplete".
        } else {
            // Manual check. Set default to estimate.
            if (task) setDurationInput(task.duration.toString());
            setStep('input');
        }

    }, [completionData]);

    if (!completionData) return null;

    const task = tasks.find(t => t.id === completionData.taskId);
    if (!task) return null; // Task might have been deleted?

    const handleConfirmDuration = () => {
        const actual = parseInt(durationInput) || task.duration;
        updateTask(task.id, { actualDuration: actual });
        toggleTaskCompletion(task.id);

        // Trigger Festivities
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });

        setStep('feedback');
    };

    const handleClose = () => {
        closeCompletionModal();
    };

    // Calculate accuracy for feedback
    // If we are in feedback step, we expect actualDuration to be set on the task OR passed in data.
    // If passed in data (Focus Mode), we use that. If updated manually, we use task.actualDuration?
    // Wait, updateTask is async in zustand? No, synchronous. 
    // But if we just called it, 'task' from hook might not double-render immediately in same tick?
    // Let's use local value for rendering if needed.

    const actualTime = completionData.elapsedTime !== undefined
        ? Math.ceil(completionData.elapsedTime / 60)
        : (parseInt(durationInput) || task.duration); // Fallback for display

    const accuracyDiff = actualTime - task.duration;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden">

                {/* Close Button */}
                <button onClick={handleClose} className="absolute top-4 left-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10">
                    <X size={20} className="text-slate-400" />
                </button>

                {step === 'input' && (
                    <div className="text-center space-y-6 pt-4 animate-in slide-in-from-bottom-5">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
                            <Clock size={32} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">כמה זמן זה לקח?</h2>
                            <p className="text-slate-500 mb-6">עזור לנו לדייק את ההערכות שלך להבא.</p>

                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => setDurationInput(Math.max(5, parseInt(durationInput) - 5).toString())} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold hover:bg-slate-200">-</button>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={durationInput}
                                        onChange={(e) => setDurationInput(e.target.value)}
                                        className="w-24 text-center text-4xl font-bold bg-transparent border-none focus:ring-0 p-0"
                                    />
                                    <span className="text-sm text-slate-400 absolute -bottom-4 left-1/2 -translate-x-1/2">דקות</span>
                                </div>
                                <button onClick={() => setDurationInput((parseInt(durationInput) + 5).toString())} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold hover:bg-slate-200">+</button>
                            </div>
                        </div>

                        <button onClick={handleConfirmDuration} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all">
                            סיימתי! 🎉
                        </button>
                    </div>
                )}

                {step === 'feedback' && (
                    <div className="text-center space-y-6 pt-2 animate-in zoom-in duration-300">
                        <div className="text-6xl mb-2">🏆</div>

                        <div>
                            <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">כל הכבוד!</h2>
                            <p className="text-lg text-slate-500 line-clamp-1">{task.title}</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                                <div className="text-xs text-slate-400 mb-1">רצף נוכחי</div>
                                <div className="text-2xl font-black text-orange-500">{streak} 🔥</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
                                <div className="text-xs text-slate-400 mb-1">זמן בפועל</div>
                                <div className={cn("text-2xl font-black", accuracyDiff <= 0 ? "text-green-500" : "text-amber-500")}>
                                    {actualTime} דק'
                                </div>
                            </div>
                        </div>

                        {/* Feedback Message */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                            {accuracyDiff <= 0 ? (
                                <p className="text-purple-700 dark:text-purple-300 font-medium">🎯 בול בזמן! הערכה מצוינת.</p>
                            ) : (
                                <p className="text-purple-700 dark:text-purple-300 font-medium">📉 שים לב, זה לקח {accuracyDiff} דק' יותר מהצפוי.</p>
                            )}
                        </div>

                        <button onClick={handleClose} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            חזור לרשימה
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
