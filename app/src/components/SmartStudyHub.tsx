"use client";

import { useStore } from '@/lib/store';
import { useMemo, useState } from 'react';
import { GraduationCap, ArrowLeft, Calendar, Brain, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ExamWizard from './ExamWizard';

interface SmartStudyHubProps {
    onBack: () => void;
}

// Helper for consistent colors
const getCourseColor = (id: string) => {
    const colors = [
        "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900",
        "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900",
        "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-100 dark:border-orange-900",
        "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-100 dark:border-rose-900",
        "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-100 dark:border-violet-900",
        "from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30 border-cyan-100 dark:border-cyan-900",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function SmartStudyHub({ onBack }: SmartStudyHubProps) {
    const { tasks, deleteTaskGroup, deleteStudyGroupByTitle } = useStore();
    const [wizardOpen, setWizardOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<{ groupId: string, title: string, examDate: string } | undefined>(undefined);

    // Group tasks into "Exams"
    const exams = useMemo(() => {
        // ... (existing logic)
        const groups: Record<string, {
            id: string; // groupId
            title: string;
            examDate: string | null;
            totalTasks: number;
            completedTasks: number;
            nextSession: string | null;
            nextTopic: string | null;
            isLegacy: boolean;
        }> = {};

        tasks.forEach(t => {
            if (t.category !== 'study' || !t.groupId) return;
            const key = t.groupId;
            if (!groups[key]) {
                const cleanName = t.title.replace('🏆 ', '').replace('📚 למידה: ', '').split(':')[0].trim();
                groups[key] = {
                    id: key,
                    title: cleanName,
                    examDate: null,
                    totalTasks: 0,
                    completedTasks: 0,
                    nextSession: null,
                    nextTopic: null,
                    isLegacy: false
                };
            }
            // ... (rest of logic same as before)
            if (t.title.includes('🏆')) {
                groups[key].examDate = t.scheduledDate;
                groups[key].title = t.title.replace('🏆 ', '');
            } else {
                groups[key].totalTasks++;
                if (t.completed) groups[key].completedTasks++;

                const today = new Date().toISOString().split('T')[0];
                if (!t.completed && t.scheduledDate >= today) {
                    if (!groups[key].nextSession || t.scheduledDate < groups[key].nextSession!) {
                        groups[key].nextSession = t.scheduledDate;
                        groups[key].nextTopic = t.title.replace('📚 למידה: ', '').replace(groups[key].title + ': ', '');
                    }
                }
            }
        });
        return Object.values(groups).sort((a, b) => (a.examDate || '9999').localeCompare(b.examDate || '9999'));
    }, [tasks]);
    // END MEMO

    const handleEdit = (exam: typeof exams[0]) => {
        if (exam.isLegacy) {
            alert("לא ניתן לערוך תוכנית ישנה. מומלץ ליצור מחדש.");
            return;
        }
        setEditingGroup({
            groupId: exam.id,
            title: exam.title,
            examDate: exam.examDate || ''
        });
        setWizardOpen(true);
    };

    const handleDelete = (exam: typeof exams[0]) => {
        if (confirm(`האם אתה בטוח שברצונך למחוק את תוכנית הלימודים של "${exam.title}"?`)) {
            if (exam.isLegacy) {
                deleteStudyGroupByTitle(exam.title);
            } else {
                deleteTaskGroup(exam.id);
            }
        }
    }

    const handleCreate = () => {
        setEditingGroup(undefined);
        setWizardOpen(true);
    }

    // --- Computed: Overall Next Exam (Command Center Data) ---
    const nextUrgentExam = useMemo(() => {
        const futureExams = exams.filter(e => e.examDate && new Date(e.examDate) >= new Date());
        return futureExams.length > 0 ? futureExams[0] : null;
    }, [exams]);

    // Helper: Days Left Calculation
    const getDaysLeft = (dateStr: string | null) => {
        if (!dateStr) return null;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto relative">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] dark:bg-blue-900/10" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[80px] dark:bg-indigo-900/10" />
            </div>

            {/* Header: Command Center */}
            <header className="p-8 pb-6 relative z-10">
                <div className="flex flex-col gap-6">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors backdrop-blur-sm bg-white/30 dark:bg-black/20">
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <Brain size={32} className="text-indigo-600" />
                                    הקמפוס
                                </h1>
                                <p className="text-slate-500 font-medium">מרכז השליטה האקדמי שלך</p>
                            </div>
                        </div>
                        <button onClick={handleCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95">
                            <Plus size={20} />
                            <span className="hidden sm:inline">תוכנית חדשה</span>
                        </button>
                    </div>

                    {/* Hero Section: Next Urgent Exam */}
                    {nextUrgentExam && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-right">
                                    <div className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-1">המבחן הקרוב ביותר</div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-2">{nextUrgentExam.title}</h2>
                                    <div className="flex items-center gap-2 text-indigo-100 bg-white/10 px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                                        <Calendar size={16} />
                                        <span>{nextUrgentExam.examDate}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl p-4 min-w-[120px]">
                                    <div className="text-4xl font-black">{getDaysLeft(nextUrgentExam.examDate)}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-100">ימים</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </header>

            {/* Content Grid */}
            <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 pb-20">
                {exams.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Calendar size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold">הלוח ריק?</h3>
                        <p>זה הזמן להוסיף את המבחן הראשון ולהתחיל ללמוד חכם.</p>
                    </div>
                )}

                {exams.map((exam, index) => {
                    const progress = Math.round((exam.completedTasks / (exam.totalTasks || 1)) * 100);
                    const daysLeft = getDaysLeft(exam.examDate);
                    const colorClass = getCourseColor(exam.id);

                    // Circular Progress Configuration
                    const radius = 24;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (progress / 100) * circumference;

                    return (
                        <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "rounded-3xl p-6 shadow-sm border flex flex-col gap-4 group hover:scale-[1.02] transition-all relative overflow-hidden bg-gradient-to-br backdrop-blur-xl",
                                colorClass
                            )}
                        >
                            {/* Glass overlay */}
                            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px]" />

                            {/* Content Wrapper */}
                            <div className="relative z-10 flex flex-col h-full gap-4">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md",
                                        daysLeft && daysLeft <= 7
                                            ? "bg-red-500/10 text-red-600 border border-red-200 dark:border-red-900"
                                            : "bg-white/50 dark:bg-black/20 text-slate-600 dark:text-slate-300 border border-white/20"
                                    )}>
                                        {daysLeft ? `${daysLeft} ימים` : 'אין תאריך'}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(exam)} className="p-2 hover:bg-white/50 rounded-lg text-slate-500 transition-colors"><Pencil size={16} /></button>
                                        <button onClick={() => handleDelete(exam)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                {/* Title & Ring */}
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white line-clamp-1 truncate" title={exam.title}>
                                            {exam.title}
                                        </h3>
                                        <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-1">
                                            <GraduationCap size={12} />
                                            {exam.examDate ? new Date(exam.examDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) : 'לא נקבע'}
                                        </div>
                                    </div>

                                    {/* Mastery Ring */}
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200 dark:text-slate-700/50" />
                                            <circle
                                                cx="32" cy="32" r={radius}
                                                stroke="currentColor" strokeWidth="6" fill="transparent"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                strokeLinecap="round"
                                                className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <span className="absolute text-xs font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
                                    </div>
                                </div>

                                {/* Next Session */}
                                <div className="mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">הצעד הבא</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-slate-800/60 shadow-sm flex items-center justify-center font-bold text-indigo-600">
                                            {exam.nextSession === new Date().toISOString().split('T')[0] ? 'היום' : <Clock size={18} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">
                                                {exam.nextTopic || 'חזרה כללית'}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">
                                                {exam.nextSession ? (exam.nextSession === new Date().toISOString().split('T')[0] ? 'בהצלחה בלימודים!' : `ביום ${new Date(exam.nextSession).toLocaleDateString('he-IL', { weekday: 'long' })}`) : 'סיימת להיום?'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Wizard Modal */}
            <AnimatePresence>
                {wizardOpen && (
                    <ExamWizard
                        onClose={() => setWizardOpen(false)}
                        initialData={editingGroup}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
