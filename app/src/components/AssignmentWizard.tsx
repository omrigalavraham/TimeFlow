"use client";

import { useState, useMemo } from 'react';
import { useStore, Course } from '@/lib/store';
import { X, Calendar, Clock, Brain, CheckCircle2, Wand2, ArrowLeft, ArrowRight, Save, LayoutList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AssignmentWizardProps {
    onClose: () => void;
    initialCourseId?: string;
    initialTitle?: string;
}

export default function AssignmentWizard({ onClose, initialCourseId, initialTitle }: AssignmentWizardProps) {
    const { courses, generateAssignmentPlan } = useStore();
    const [step, setStep] = useState(1);

    // Form State
    const [title, setTitle] = useState(initialTitle || '');
    const [courseId, setCourseId] = useState(initialCourseId || '');
    const [deadline, setDeadline] = useState('');
    const [estimatedHours, setEstimatedHours] = useState<number>(3);
    const [breakdownStrategy, setBreakdownStrategy] = useState<'auto' | 'manual' | 'one_shot'>('auto');
    const [manualSteps, setManualSteps] = useState<string[]>([]);
    const [manualStepInput, setManualStepInput] = useState('');

    const handleSubmit = () => {
        generateAssignmentPlan({
            title,
            courseId,
            deadline,
            estimatedHours,
            breakdownStrategy,
            manualSteps: breakdownStrategy === 'manual' ? manualSteps : undefined
        });
        onClose();
    };

    const addManualStep = () => {
        if (!manualStepInput) return;
        setManualSteps([...manualSteps, manualStepInput]);
        setManualStepInput('');
    }

    const steps = [
        { num: 1, title: 'מה המשימה?', icon: LayoutList },
        { num: 2, title: 'כמה זמן?', icon: Clock },
        { num: 3, title: 'איך מפצלים?', icon: Brain },
    ];

    const getProposedScheduleCount = () => {
        if (breakdownStrategy === 'one_shot') return 1;
        if (breakdownStrategy === 'manual') return manualSteps.length;
        if (breakdownStrategy === 'auto') return Math.ceil((estimatedHours * 60) / 90);
        return 0;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
                            הוספת מטלה חכמה
                        </h2>
                        <p className="text-slate-500 text-sm">הדרך הקלה לפרק משימות גדולות</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center gap-8 px-12 py-6 border-b border-slate-100 dark:border-slate-800/50">
                    {steps.map((s) => (
                        <div key={s.num} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all",
                                step >= s.num
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
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
                            {courses.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">שיוך לקורס (אופציונלי)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {courses.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setCourseId(c.id === courseId ? '' : c.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all border-2",
                                                    courseId === c.id
                                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                                        : "border-transparent bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                                                )}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">שם המטלה</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="למשל: עבודה מסכמת בפסיכולוגיה"
                                    className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">מתי ההגשה?</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">כמה זמן זה ייקח? (הערכה גסה)</label>
                                    <span className="font-mono bg-indigo-100 text-indigo-700 px-2 rounded-md font-bold">{estimatedHours} שעות</span>
                                </div>
                                <input
                                    type="range"
                                    min="1" max="20" step="0.5"
                                    value={estimatedHours}
                                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>שעה אחת</span>
                                    <span>10 שעות</span>
                                    <span>20+ שעות</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setBreakdownStrategy('auto')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                        breakdownStrategy === 'auto' ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                    )}
                                >
                                    <Wand2 className="text-indigo-500" size={24} />
                                    <div className="font-bold text-sm">אוטומטי</div>
                                    <div className="text-xs text-center text-slate-500">חלוקה חכמה לסשנים של שעה וחצי</div>
                                </button>
                                <button
                                    onClick={() => setBreakdownStrategy('manual')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                        breakdownStrategy === 'manual' ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                    )}
                                >
                                    <LayoutList className="text-indigo-500" size={24} />
                                    <div className="font-bold text-sm">ידני</div>
                                    <div className="text-xs text-center text-slate-500">אני אגדיר את השלבים של המשימה</div>
                                </button>
                                <button
                                    onClick={() => setBreakdownStrategy('one_shot')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                                        breakdownStrategy === 'one_shot' ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                                    )}
                                >
                                    <CheckCircle2 className="text-indigo-500" size={24} />
                                    <div className="font-bold text-sm">בלוק אחד</div>
                                    <div className="text-xs text-center text-slate-500">לשבת ולגמור עם זה בפעם אחת</div>
                                </button>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6">
                                {breakdownStrategy === 'auto' && (
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-indigo-600 mb-2">{getProposedScheduleCount()}</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-300">מפגשי למידה יווצרו בלוח</div>
                                        <p className="text-sm text-slate-500 mt-2">המערכת תפזר אותם באופן שווה עד הדדליין</p>
                                    </div>
                                )}

                                {breakdownStrategy === 'one_shot' && (
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-indigo-600 mb-2">1</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-300">סשן מרוכז</div>
                                        <p className="text-sm text-slate-500 mt-2">נקבע לדדליין (או להיום אם הדדליין עבר)</p>
                                    </div>
                                )}

                                {breakdownStrategy === 'manual' && (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={manualStepInput}
                                                onChange={(e) => setManualStepInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addManualStep()}
                                                placeholder="הוסף שלב (למשל: איסוף מקורות)"
                                                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500"
                                            />
                                            <button onClick={addManualStep} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
                                                <ArrowLeft size={16} />
                                            </button>
                                        </div>
                                        <ul className="space-y-2 max-h-32 overflow-y-auto">
                                            {manualSteps.map((s, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                    <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs ml-2">{i + 1}</span>
                                                    {s}
                                                </li>
                                            ))}
                                            {manualSteps.length === 0 && <li className="text-slate-400 text-xs text-center italic">אין שלבים עדיין</li>}
                                        </ul>
                                    </div>
                                )}
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
                        <button onClick={onClose} className="px-6 py-3 font-medium text-slate-500 hover:text-slate-800 transition-colors">
                            ביטול
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={step === 1 && !title}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            המשך
                            <ArrowLeft size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!deadline}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                        >
                            <Wand2 size={18} />
                            שבץ ביומן
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
