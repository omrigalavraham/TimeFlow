"use client";

import { useState } from 'react';
import { useStore, Course, SyllabusItem, AssignmentType } from '@/lib/store';
import { X, Book, GraduationCap, Plus, Trash2, PieChart, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, generateId } from '@/lib/utils';

interface CourseWizardProps {
    onClose: () => void;
    initialData?: Course;
}

export default function CourseWizard({ onClose, initialData }: CourseWizardProps) {
    const { addCourse, updateCourse } = useStore();
    const [step, setStep] = useState(1);

    // Form State
    const [title, setTitle] = useState(initialData?.title || '');
    const [syllabus, setSyllabus] = useState<SyllabusItem[]>(initialData?.syllabus || []);

    // Syllabus Item Input State
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemType, setNewItemType] = useState<AssignmentType>('exercise');
    const [newItemWeight, setNewItemWeight] = useState<number>(0);

    const handleSubmit = () => {
        if (!title) return;

        const courseData: Course = {
            id: initialData?.id || generateId(),
            title,
            syllabus
        };

        if (initialData) {
            updateCourse(initialData.id, courseData);
        } else {
            addCourse(courseData);
        }

        onClose();
    };

    const addSyllabusItem = () => {
        if (!newItemTitle) return;

        const newItem: SyllabusItem = {
            id: generateId(),
            title: newItemTitle,
            type: newItemType,
            weight: newItemWeight,
            isCompleted: false
        };

        setSyllabus([...syllabus, newItem]);
        setNewItemTitle('');
        setNewItemWeight(0);
        // Keep type same for quick entry
    };

    const removeSyllabusItem = (id: string) => {
        setSyllabus(syllabus.filter(item => item.id !== id));
    };

    const totalWeight = syllabus.reduce((acc, item) => acc + item.weight, 0);

    const steps = [
        { num: 1, title: 'פרטי הקורס', icon: Book },
        { num: 2, title: 'סילבוס ודרישות', icon: GraduationCap },
    ];

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
                            <GraduationCap className="text-indigo-500" />
                            {initialData ? 'עריכת קורס' : 'קורס חדש'}
                        </h2>
                        <p className="text-slate-500 text-sm">הגדרת המבנה והדרישות האקדמיות</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center gap-4 px-12 py-6 border-b border-slate-100 dark:border-slate-800/50">
                    {steps.map((s) => (
                        <button
                            key={s.num}
                            onClick={() => setStep(s.num)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                                step === s.num
                                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold"
                                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                step === s.num ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700"
                            )}>
                                {s.num}
                            </div>
                            {s.title}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">שם הקורס</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="למשל: אלגוריתמים ומבני נתונים"
                                    className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl flex gap-4 items-start">
                                <div className="p-2 bg-white dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-300">
                                    <Book size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-1">התחלה טובה</h4>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                                        הגדרת הקורס בצורה מסודרת תעזור לך לעקוב אחרי המשימות, המבחנים והציונים במקום אחד.
                                        בשלב הבא תוכל להוסיף את הסילבוס.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-medium">מרכיבי הציון</span>
                                <span className={cn(
                                    "font-bold px-2 py-1 rounded-md",
                                    totalWeight === 100 ? "bg-green-100 text-green-700" :
                                        totalWeight > 100 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                )}>
                                    סה"כ משקל: {totalWeight}%
                                </span>
                            </div>

                            {/* Add Item Form */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-6">
                                        <input
                                            type="text"
                                            value={newItemTitle}
                                            onChange={(e) => setNewItemTitle(e.target.value)}
                                            placeholder="שם המטלה (למשל: תרגיל 1)"
                                            className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && addSyllabusItem()}
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <select
                                            value={newItemType}
                                            onChange={(e) => setNewItemType(e.target.value as AssignmentType)}
                                            className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-sm"
                                        >
                                            <option value="exercise">תרגיל</option>
                                            <option value="project">פרויקט</option>
                                            <option value="presentation">מצגת</option>
                                            <option value="exam">מבחן</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={newItemWeight || ''}
                                            onChange={(e) => setNewItemWeight(Number(e.target.value))}
                                            placeholder="%"
                                            className="w-full p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <button
                                            onClick={addSyllabusItem}
                                            disabled={!newItemTitle}
                                            className="w-full h-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {syllabus.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                            לא הוגדרו עדיין מטלות לקורס זה.
                                            <br />
                                            זה המקום להוסיף תרגילים, עבודות ומבחנים.
                                        </div>
                                    ) : (
                                        syllabus.map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        item.type === 'exam' ? 'bg-red-500' :
                                                            item.type === 'project' ? 'bg-purple-500' :
                                                                'bg-blue-500'
                                                    )} />
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{item.title}</span>
                                                    <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                        {item.type === 'exam' ? 'מבחן' :
                                                            item.type === 'project' ? 'פרויקט' :
                                                                item.type === 'presentation' ? 'מצגת' : 'תרגיל'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {item.weight > 0 && (
                                                        <span className="text-sm font-bold text-slate-500">{item.weight}%</span>
                                                    )}
                                                    <button
                                                        onClick={() => removeSyllabusItem(item.id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
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

                    {step < 2 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!title}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            המשך לסילבוס
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                        >
                            <Save size={18} />
                            שמור קורס
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
