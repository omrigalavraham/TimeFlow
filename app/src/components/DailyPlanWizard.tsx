"use client";

import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { calculateWorkload, optimizeDay, getMinutesUntil, DayAnalysis, OptimizedPlan } from '@/lib/planner';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, AlertTriangle, Calendar, Sun, Moon, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export default function DailyPlanWizard() {
    const { tasks, selectedDate, setDayStatus, setWorkEndTime, scheduleTasks, moveTaskToDate } = useStore();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [targetTime, setTargetTime] = useState<string>("18:00");
    const [analysis, setAnalysis] = useState<DayAnalysis | null>(null);
    const [plan, setPlan] = useState<OptimizedPlan | null>(null);

    // Filter for today's tasks only
    const todaysTasks = useMemo(() => tasks.filter(t => t.scheduledDate === selectedDate && !t.completed && t.type !== 'focus'), [tasks, selectedDate]);
    const totalMinutes = useMemo(() => todaysTasks.reduce((acc, t) => acc + t.duration, 0), [todaysTasks]);

    // Step 2: Run Analysis
    const runAnalysis = () => {
        const available = getMinutesUntil(targetTime);
        const result = calculateWorkload(todaysTasks, available);
        setAnalysis(result);

        if (result.status === 'impossible' || result.status === 'tight') {
            const optimization = optimizeDay(todaysTasks, available);
            setPlan(optimization);
        } else {
            setPlan(null); // No changes needed
        }

        setStep(3);
        setWorkEndTime(targetTime);
    };

    const applyPlan = () => {
        // Move deferred tasks to tomorrow
        if (plan && plan.deferredTasks.length > 0) {
            const tomorrow = new Date(selectedDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            plan.deferredTasks.forEach(task => {
                moveTaskToDate(task.id, tomorrowStr);
            });
        }

        // Schedule the remaining tasks
        // We use 'eat-the-frog' as default smart sort for now, or maybe just purely time based?
        // Let's us 'batching' or specific priority order from planner?
        // For simplicity, let's trigger the store's scheduleTasks which handles assigning times.
        scheduleTasks('eat-the-frog'); // Default strategy

        setDayStatus('active');
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    if (step === 1) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-8">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sun size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">בוקר טוב! ☀️</h2>
                    <p className="text-lg text-slate-500 max-w-md mx-auto">
                        בוא נתכנן את היום שלך בחוכמה. יש לך <span className="font-bold text-indigo-600 dark:text-indigo-400">{todaysTasks.length} משימות</span> שמסתכמות ב-<span className="font-bold text-indigo-600 dark:text-indigo-400">{Math.floor(totalMinutes / 60)} שעות ו-{totalMinutes % 60} דקות</span>.
                    </p>

                    <button
                        onClick={() => setStep(2)}
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white text-xl font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
                    >
                        בוא נתחיל &larr;
                    </button>

                    <button onClick={() => setDayStatus('active')} className="text-sm text-slate-400 hover:text-slate-600 underline">
                        דלג על תכנון (אני כבר מסודר)
                    </button>
                </div>
            </div>
        )
    }

    if (step === 2) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto border border-slate-100 dark:border-slate-800 animate-in slide-in-from-right-8 fade-in">
                <div className="text-center space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">מתי מסיימים היום? 🏁</h2>
                        <p className="text-slate-500">אנחנו נדאג שהכל ייכנס עד אז.</p>
                    </div>

                    <div className="relative inline-block">
                        <input
                            type="time"
                            value={targetTime}
                            onChange={(e) => setTargetTime(e.target.value)}
                            className="text-5xl font-black bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl text-center w-64 outline-none focus:ring-4 ring-indigo-500/30 transition-all font-mono"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200"
                        >
                            חזרה
                        </button>
                        <button
                            onClick={runAnalysis}
                            className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
                        >
                            בדוק התאמה ✨
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Step 3: Results
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-6">

                {/* Status Icon */}
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2",
                    analysis?.status === 'comfortable' ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                        analysis?.status === 'tight' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" :
                            "bg-red-100 text-red-600 dark:bg-red-900/30"
                )}>
                    {analysis?.status === 'comfortable' && <CheckCircle size={40} />}
                    {analysis?.status === 'tight' && <Coffee size={40} />}
                    {analysis?.status === 'impossible' && <AlertTriangle size={40} />}
                </div>

                <h2 className="text-2xl font-bold">
                    {analysis?.status === 'comfortable' && "בול בפוני! יש לך יום מאוזן. 👌"}
                    {analysis?.status === 'tight' && "יום צפוף לפניך! 😬"}
                    {analysis?.status === 'impossible' && "אופס... העיניים גדולות מהקיבה 🍔"}
                </h2>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-right dir-rtl space-y-4">
                    <div className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-500">זמן עבודה נדרש:</span>
                        <span className="font-mono font-bold">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="text-slate-500">זמן פנוי עד {targetTime}:</span>
                        <span className={cn("font-mono font-bold", analysis?.overflowMinutes || 0 > 0 ? "text-red-500" : "text-green-500")}>
                            {Math.floor((analysis?.availableMinutes || 0) / 60)}h {(analysis?.availableMinutes || 0) % 60}m
                        </span>
                    </div>
                </div>

                {/* Plan Proposal */}
                {plan ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-right">
                        <h3 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2">ההצעה שלי:</h3>
                        <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 leading-relaxed">
                            {plan.reason}
                        </p>

                        {plan.deferredTasks.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-400 uppercase">נדחה למחר ({plan.deferredTasks.length}):</div>
                                {plan.deferredTasks.map(t => (
                                    <div key={t.id} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-800 p-2 rounded shadow-sm opacity-70">
                                        <Calendar size={12} />
                                        <span className="truncate">{t.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-slate-500">אין שינויים נדרשים. הכל נכנס! 🎉</p>
                )}

                <button
                    onClick={applyPlan}
                    className="w-full py-4 bg-slate-900 dark:bg-green-600 text-white text-xl font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                >
                    {plan?.deferredTasks.length ? "קבל את התוכנית וצא לדרך" : "יאללה לעבודה!"}
                </button>

                {plan?.deferredTasks.length ? (
                    <button onClick={() => {
                        // User rejects optimization, accepts override
                        setDayStatus('active');
                        scheduleTasks('eat-the-frog'); // Just schedule anyway
                    }} className="text-sm text-red-400 hover:text-red-500 underline mt-2">
                        לא, אני אנסה לדחוס הכל (לא מומלץ)
                    </button>
                ) : null}
            </div>
        </div>
    );
}
