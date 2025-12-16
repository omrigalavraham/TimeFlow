"use client";

import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { X, Clock, Play, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

export default function TaskCompletionModal() {
    const { completionData, closeCompletionModal, updateTask, toggleTaskCompletion, streak, tasks, addTask } = useStore();

    // Steps: 
    // 1. 'input': Enter actual time spent.
    // 2. 'completion-check': "Did you finish everything?"
    // 3. 'split-task': If not finished, configure the follow-up task.
    // 4. 'feedback': Success screen (Festivities).
    const [step, setStep] = useState<'input' | 'completion-check' | 'split-task' | 'feedback'>('input');

    const [durationInput, setDurationInput] = useState('');

    // Split Task State
    const [splitTitle, setSplitTitle] = useState('');
    const [splitDuration, setSplitDuration] = useState('30');
    const [splitDate, setSplitDate] = useState<'today' | 'tomorrow'>('tomorrow');

    // Reset state when modal completionId changes
    useEffect(() => {
        if (!completionData) {
            setStep('input');
            setDurationInput('');
            return;
        }

        const currentTasks = useStore.getState().tasks;
        const task = currentTasks.find(t => t.id === completionData.taskId);

        if (completionData.elapsedTime !== undefined) {
            // If coming from Focus Mode (timer), we might still want to ask if finished?
            // For now, let's assume if timer ended, we ask.
            setDurationInput(Math.ceil(completionData.elapsedTime / 60).toString());
            setStep('completion-check'); // Skip direct input if we have trusted timer data? Or confirm it?
            // Let's stick to flow: Input -> Check.
            // If we have data, populate input but show step 'input' to allow adjustment?
            // Or better: Jump to check if we trust the timer.
            // User wants to confirm time usually. Let's start at 'input' but pre-filled.
            setStep('input');
        } else {
            if (task) setDurationInput(task.duration.toString());
            setStep('input');
        }

        if (task) {
            setSplitTitle(`המשך: ${task.title}`);
        }

    }, [completionData]);

    if (!completionData) return null;

    const task = tasks.find(t => t.id === completionData.taskId);
    if (!task) return null;

    const handleTimeSubmit = () => {
        setStep('completion-check');
    };

    const handleFullCompletion = () => {
        // Normal Flow
        const actual = parseInt(durationInput) || task.duration;
        updateTask(task.id, { actualDuration: actual });
        toggleTaskCompletion(task.id);

        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        setStep('feedback');
    };

    const handlePartialCompletion = () => {
        // Go into Split Wizard
        setStep('split-task');
    };

    const confirmSplit = () => {
        // 1. Complete original task
        const actual = parseInt(durationInput) || task.duration;
        updateTask(task.id, { actualDuration: actual });
        toggleTaskCompletion(task.id);

        // 2. Create NEW Independent Task
        const targetDate = new Date();
        if (splitDate === 'tomorrow') {
            targetDate.setDate(targetDate.getDate() + 1);
        }
        const dateStr = targetDate.toISOString().split('T')[0];

        addTask({
            title: splitTitle,
            duration: parseInt(splitDuration),
            priority: task.priority, // Inherit priority?
            type: 'task',
            recurrence: undefined, // Usually follow-ups are one-off
            scheduledDate: dateStr
            // User didn't specify exact time for split, so flexible.
        });

        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        setStep('feedback');
    };

    const handleClose = () => {
        closeCompletionModal();
    };

    const actualTime = completionData.elapsedTime !== undefined
        ? Math.ceil(completionData.elapsedTime / 60)
        : (parseInt(durationInput) || task.duration);

    const accuracyDiff = actualTime - task.duration;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 relative overflow-hidden">
                <button onClick={handleClose} className="absolute top-4 left-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10">
                    <X size={20} className="text-slate-400" />
                </button>

                {/* Step 1: Input Time */}
                {step === 'input' && (
                    <div className="text-center space-y-6 pt-4 animate-in slide-in-from-bottom-5">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
                            <Clock size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">כמה זמן זה לקח?</h2>
                            <div className="flex items-center justify-center gap-4 mt-6">
                                <button onClick={() => setDurationInput(Math.max(5, parseInt(durationInput) - 5).toString())} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold hover:bg-slate-200">-</button>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={durationInput}
                                        onChange={(e) => setDurationInput(e.target.value)}
                                        className="w-24 text-center text-4xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 dark:text-white"
                                    />
                                    <span className="text-sm text-slate-400 absolute -bottom-4 left-1/2 -translate-x-1/2">דקות</span>
                                </div>
                                <button onClick={() => setDurationInput((parseInt(durationInput) + 5).toString())} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold hover:bg-slate-200">+</button>
                            </div>
                        </div>
                        <button onClick={handleTimeSubmit} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all">
                            המשך
                        </button>
                    </div>
                )}

                {/* Step 2: Completion Check */}
                {step === 'completion-check' && (
                    <div className="text-center space-y-6 pt-4 animate-in slide-in-from-right-5">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">סיימת את כל המשימה?</h2>
                        <div className="space-y-3">
                            <button onClick={handleFullCompletion} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all">
                                כן, הכל בוצע! 🎉
                            </button>
                            <button onClick={handlePartialCompletion} className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                לא, נשאר עוד קצת...
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Split Task Wizard */}
                {step === 'split-task' && (
                    <div className="text-center space-y-4 pt-4 animate-in slide-in-from-right-5">
                        <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">פיצול משימה</h2>
                        <p className="text-slate-500 text-sm">המשימה המקורית תושלם. מה נעשה עם השאר?</p>

                        <div className="space-y-4 text-right">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">שם המשימה החדשה</label>
                                <input
                                    value={splitTitle}
                                    onChange={(e) => setSplitTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">כמה זמן נשאר?</label>
                                    <input
                                        type="number"
                                        value={splitDuration}
                                        onChange={(e) => setSplitDuration(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">מתי להמשיך?</label>
                                    <select
                                        value={splitDate}
                                        onChange={(e) => setSplitDate(e.target.value as any)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    >
                                        <option value="today">היום</option>
                                        <option value="tomorrow">מחר</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button onClick={confirmSplit} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all mt-4">
                            פצל וסיים
                        </button>
                    </div>
                )}

                {/* Step 4: Feedback (Success) */}
                {step === 'feedback' && (
                    <div className="text-center space-y-6 pt-2 animate-in zoom-in duration-300">
                        <div className="text-6xl mb-2">🏆</div>
                        <div>
                            <h2 className="text-3xl font-black mb-2 text-slate-900 dark:text-white">כל הכבוד!</h2>
                            <p className="text-lg text-slate-500 line-clamp-1">{task.title}</p>
                        </div>
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
                        <button onClick={handleClose} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            חזור לרשימה
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
