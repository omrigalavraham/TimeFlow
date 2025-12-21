"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { X, Calendar, BookOpen, Clock, CheckCircle2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ExamWizardProps {
    onClose: () => void;
    initialData?: {
        groupId: string;
        title: string;
        examDate: string; // ISO
    };
}

export default function ExamWizard({ onClose, initialData }: ExamWizardProps) {
    const { generateStudyPlan } = useStore();
    const [step, setStep] = useState(1);

    // Form State
    const [title, setTitle] = useState(initialData ? initialData.title.replace('🏆 ', '') : '');
    const [examDate, setExamDate] = useState(initialData?.examDate || '');
    const [topicsInput, setTopicsInput] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4]); // Sun-Thu default
    const [sessionDuration, setSessionDuration] = useState(120); // 2 hours

    // If editing, we should ideally try to fetch the existing topics... 
    // But since we don't store them explicitly as a list on the group, we might start empty or just let the user "Re-plan".
    // For V1, we accept that editing means re-pasting the topics or entering new ones.

    const handleSubmit = () => {
        // Parse topics
        const topics = topicsInput.split('\n').map(t => t.trim()).filter(t => t.length > 0);

        generateStudyPlan({
            title,
            deadline: examDate,
            startDate,
            sessionDuration,
            selectedDays,
            examAlert: '1_day_before',
            topics,
            existingGroupId: initialData?.groupId
        });

        onClose();
    };

    const steps = [
        { num: 1, title: 'פרטי המבחן', icon: Calendar },
        { num: 2, title: 'חומר הלימוד', icon: BookOpen },
        { num: 3, title: 'זמנים', icon: Clock },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Wand2 className="text-indigo-500" />
                            {initialData ? 'עריכת תוכנית למידה' : 'בניית תוכנית למידה'}
                        </h2>
                        <p className="text-slate-500 text-sm">המאמן האישי שלך למבחנים</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between px-12 py-6 relative">
                    {/* Line */}
                    <div className="absolute top-1/2 left-12 right-12 h-1 bg-slate-100 dark:bg-slate-800 -z-10 -translate-y-1/2" />

                    {steps.map((s) => (
                        <div key={s.num} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all",
                                step >= s.num ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            )}>
                                {step > s.num ? <CheckCircle2 size={20} /> : s.num}
                            </div>
                            <span className={cn("text-xs font-bold", step >= s.num ? "text-indigo-600" : "text-slate-400")}>
                                {s.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">שם הקורס / המבחן</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="למשל: מבוא למדעי המחשב"
                                    className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">תאריך המבחן</label>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-200 text-sm">
                                💡 טיפ: פשוט העתק-הדבק את רשימת הנושאים מהסילבוס. כל שורה תהפוך לנושא למידה.
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">רשימת נושאים (כל נושא בשורה חדשה)</label>
                                <textarea
                                    value={topicsInput}
                                    onChange={(e) => setTopicsInput(e.target.value)}
                                    placeholder={"פרק 1: מבוא\nפרק 2: פונקציות\nפרק 3: לולאות\n..."}
                                    className="w-full h-64 text-base p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">באילו ימים אתה לומד?</label>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (selectedDays.includes(idx)) setSelectedDays(prev => prev.filter(d => d !== idx));
                                                else setSelectedDays(prev => [...prev, idx]);
                                            }}
                                            className={cn(
                                                "w-12 h-12 rounded-xl font-bold transition-all",
                                                selectedDays.includes(idx)
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">מתי מתחילים?</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="bg-white dark:bg-slate-800 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            חזור
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={step === 1 && (!title || !examDate)}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            המשך
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                        >
                            {initialData ? 'עדכן תוכנית' : 'צור תוכנית'} ✨
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
