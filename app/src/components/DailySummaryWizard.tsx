"use client";

import { useStore, Task } from '@/lib/store';
import { useState, useEffect } from 'react';
import { X, ArrowRight, Trash2, Calendar, CheckCircle, PieChart, Star, Sunset } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

export default function DailySummaryWizard() {
    // Local state for visibility and step
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'intro' | 'cleanup' | 'summary'>('intro');

    const { tasks, selectedDate, moveTaskToDate, deleteTask } = useStore();

    // Data Calculation
    const todayTasks = tasks.filter(t => {
        const isToday = t.scheduledDate === selectedDate || (!t.scheduledDate && new Date().toISOString().split('T')[0] === selectedDate);
        return isToday && t.type !== 'break'; // Don't cleanup breaks
    });

    const completedTasks = todayTasks.filter(t => t.completed);
    const incompleteTasks = todayTasks.filter(t => !t.completed);

    // Derived Stats
    const completionRate = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
    const totalFocusMinutes = completedTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);

    // Helpers
    const handleMoveToTomorrow = (taskId: string) => {
        const tomorrow = new Date(selectedDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        moveTaskToDate(taskId, tomorrow.toISOString().split('T')[0]);
    };

    const handleMoveToNextWeek = (taskId: string) => {
        const nextWeek = new Date(selectedDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        moveTaskToDate(taskId, nextWeek.toISOString().split('T')[0]);
    };

    const handleClose = () => {
        setIsOpen(false);
        setStep('intro');
    };

    const nextStep = () => {
        if (step === 'intro') {
            if (incompleteTasks.length > 0) {
                setStep('cleanup');
            } else {
                setStep('summary'); // Skip cleanup if nothing left
                confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
            }
        } else if (step === 'cleanup') {
            setStep('summary');
            confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        } else {
            handleClose();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
                <Sunset size={20} /> סיכום יום
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Sunset className="text-orange-500" /> סיכום יום
                    </h2>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {step === 'intro' && (
                        <div className="text-center space-y-8 animate-in slide-in-from-bottom-8 duration-500">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">בוא נראה איך היה היום...</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <PieChart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{completionRate}%</div>
                                    <div className="text-sm text-slate-500">השלמה</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{completedTasks.length}</div>
                                    <div className="text-sm text-slate-500">משימות בוצעו</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">{totalFocusMinutes}</div>
                                    <div className="text-sm text-slate-500">דקות בפוקוס</div>
                                </div>
                            </div>

                            {incompleteTasks.length > 0 ? (
                                <p className="text-lg text-slate-600 dark:text-slate-300">
                                    יש לך עוד <span className="font-bold text-orange-500">{incompleteTasks.length}</span> משימות פתוחות. בוא נעשה סדר. 🧹
                                </p>
                            ) : (
                                <p className="text-lg text-green-600 font-bold">סיימת הכל! איזה יום מדהים! 🌟</p>
                            )}
                        </div>
                    )}

                    {step === 'cleanup' && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold mb-2">נקיון שולחן 🧹</h3>
                                <p className="text-slate-500">מה עושים עם מה שנשאר?</p>
                            </div>

                            <div className="space-y-3">
                                {incompleteTasks.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-purple-200 transition-colors">
                                        <span className="font-medium truncate max-w-[40%]">{task.title}</span>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleMoveToTomorrow(task.id)}
                                                className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg shadow-sm hover:text-blue-600 hover:shadow-md transition-all flex items-center gap-1"
                                                title="העבר למחר"
                                            >
                                                <ArrowRight size={14} /> למחר
                                            </button>
                                            <button
                                                onClick={() => handleMoveToNextWeek(task.id)}
                                                className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg shadow-sm hover:text-purple-600 hover:shadow-md transition-all flex items-center gap-1"
                                                title="העבר לשבוע הבא"
                                            >
                                                <Calendar size={14} /> שבוע הבא
                                            </button>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="p-2 bg-white dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-lg shadow-sm hover:shadow-md transition-all"
                                                title="מחק משימה"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {incompleteTasks.length === 0 && (
                                    <div className="text-center py-10 text-slate-400">
                                        <CheckCircle size={48} className="mx-auto mb-4 text-green-200" />
                                        הכל נקי! אפשר להמשיך.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'summary' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500 py-10">
                            <div className="text-8xl animate-bounce">🌙</div>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white">לילה טוב!</h3>
                            <p className="text-xl text-slate-600 dark:text-slate-300">
                                הלו"ז שלך למחר מוכן ונקי.<br />
                                הזמן שלך לנוח.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    {step === 'cleanup' && incompleteTasks.length > 0 ? (
                        <button onClick={nextStep} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            סיימתי לסדר, בוא נסגור את היום
                        </button>
                    ) : (
                        <button onClick={nextStep} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity">
                            {step === 'summary' ? 'סגור' : 'המשך'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
