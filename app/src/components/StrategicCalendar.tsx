"use client";

import { useStore, Task } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, GraduationCap, Clock, Calendar, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import TaskInput from './TaskInput';

interface StrategicCalendarProps {
    onClose?: () => void;
    readOnly?: boolean;
}

export default function StrategicCalendar({ onClose, readOnly = false }: StrategicCalendarProps) {
    const tasks = useStore((state) => state.tasks);

    // Internal state
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [addingDate, setAddingDate] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDateState, setSelectedDateState] = useState<Date>(new Date());

    const { daysMatrix, taskMap } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayIndex = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        const matrix = [];
        const map: Record<string, Task[]> = {};

        tasks.forEach(t => {
            if (t.scheduledDate) {
                if (!map[t.scheduledDate]) map[t.scheduledDate] = [];
                map[t.scheduledDate].push(t);
            }
        });

        let row = [];
        for (let i = 0; i < startDayIndex; i++) row.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            row.push(new Date(year, month, d));
            if (row.length === 7) {
                matrix.push(row);
                row = [];
            }
        }
        if (row.length > 0) matrix.push(row);

        return { daysMatrix: matrix, taskMap: map };
    }, [currentDate, tasks]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // Side Panel Data
    const selectedDateStr = `${selectedDateState.getFullYear()}-${String(selectedDateState.getMonth() + 1).padStart(2, '0')}-${String(selectedDateState.getDate()).padStart(2, '0')}`;
    const selectedDayTasks = taskMap[selectedDateStr] || [];

    const isToday = (date: Date) => {
        const now = new Date();
        return date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900/80 backdrop-blur-xl w-full max-w-6xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-700/50"
            >
                {/* LEFT PANEL: Day Detail (Side Panel) */}
                <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-800/50 p-6 flex flex-col gap-6 border-l border-slate-200 dark:border-slate-700 order-2 md:order-1">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {selectedDateState.toLocaleDateString('he-IL', { weekday: 'long' })}
                        </h3>
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white">
                            {selectedDateState.getDate()}
                            <span className="text-lg font-medium text-slate-500 mr-2">
                                {selectedDateState.toLocaleDateString('he-IL', { month: 'long' })}
                            </span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {selectedDayTasks.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <Clock size={48} className="mx-auto mb-4 text-slate-300" />
                                <p>יום פנוי לחלוטין!</p>
                                <button
                                    onClick={() => setAddingDate(selectedDateStr)}
                                    className="mt-4 text-indigo-400 hover:text-indigo-300 font-bold underline"
                                >
                                    הוסף משימה ראשונה
                                </button>
                            </div>
                        ) : (
                            selectedDayTasks.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setEditingTask(t)}
                                    className={cn(
                                        "p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all",
                                        t.title.includes('מבחן') || t.title.includes('🏆')
                                            ? "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20"
                                            : "bg-white/50 dark:bg-slate-700/50 border-white/10 hover:bg-white/80 dark:hover:bg-slate-700"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2">{t.title}</div>
                                        {t.completed && <div className="text-green-500 text-xs">✓</div>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                        {t.startTime && <span className="bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{t.startTime}</span>}
                                        <span className="truncate">{t.category}</span>
                                    </div>
                                </div>
                            ))
                        )}

                        <button
                            onClick={() => setAddingDate(selectedDateStr)}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-indigo-400 hover:border-indigo-400 transition-colors font-bold mt-4"
                        >
                            + הוסף משימה
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: Calendar Grid (Main Area) */}
                <div className="flex-1 flex flex-col order-1 md:order-2 bg-gradient-to-br from-indigo-50/50 to-white/50 dark:from-slate-900 dark:to-slate-800/30">
                    {/* Header */}
                    <div className="p-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                {currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex bg-slate-200 dark:bg-slate-800 rounded-full p-1">
                                <button onClick={handleNextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all"><ChevronRight size={20} /></button>
                                <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all"><ChevronLeft size={20} /></button>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors">
                            <X />
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 p-6 pt-0">
                        <div className="grid grid-cols-7 gap-4 mb-2 text-center text-slate-400 font-bold text-sm">
                            <div>א</div><div>ב</div><div>ג</div><div>ד</div><div>ה</div><div>ו</div><div>ש</div>
                        </div>
                        <div className="grid grid-cols-7 grid-rows-6 gap-2 h-full">
                            {daysMatrix.flat().map((date, idx) => {
                                if (!date) return <div key={idx} />;

                                const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                const isSelected = date.getTime() === selectedDateState.getTime();
                                const isCurrentDay = isToday(date);
                                const dayTasks = taskMap[dateString] || [];

                                const hasExam = dayTasks.some(t => (t.title.includes('מבחן') || t.title.includes('🏆')) && !t.title.includes('למידה'));
                                const hasAssignment = dayTasks.some(t => t.type === 'project' || t.title.includes('🏁'));

                                const loadLevel = Math.min(dayTasks.length, 5); // 0-5 scale

                                return (
                                    <motion.button
                                        key={idx}
                                        whileHover={{ scale: 0.95 }}
                                        onClick={() => setSelectedDateState(date)}
                                        className={cn(
                                            "relative rounded-xl flex flex-col items-center justify-center transition-all min-h-[60px]",
                                            isSelected
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-300 dark:ring-indigo-700 z-10"
                                                : isCurrentDay
                                                    ? "bg-white dark:bg-slate-700 text-indigo-500 border border-indigo-200 dark:border-indigo-800"
                                                    : "hover:bg-white/60 dark:hover:bg-slate-700/60 bg-white/20 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400",
                                            // Exam Style (Rose)
                                            hasExam && !isSelected && "bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900",
                                            // Assignment Style (Amber) - Exam takes precedence if both exist, or mix?
                                            // Let's make Assignment slightly different or mix if both?
                                            // If both, maybe a gradient? For now, if NOT exam, show assignment color.
                                            hasAssignment && !hasExam && !isSelected && "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900"
                                        )}
                                    >
                                        <span className={cn("text-lg font-bold", isSelected && "scale-110")}>{date.getDate()}</span>

                                        {/* Exam Beacon (Top Right) */}
                                        {hasExam && (
                                            <span className="absolute top-1 right-1 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                            </span>
                                        )}

                                        {/* Assignment Beacon (Top Left) - Amber */}
                                        {hasAssignment && (
                                            <span className="absolute top-1 left-1 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                            </span>
                                        )}

                                        {/* Load Dots */}
                                        <div className="flex gap-0.5 mt-1">
                                            {[...Array(Math.min(dayTasks.length, 3)).keys()].map(i => (
                                                <div key={i} className={cn(
                                                    "w-1 h-1 rounded-full",
                                                    isSelected ? "bg-white/50" : "bg-indigo-400"
                                                )} />
                                            ))}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Modal for Input */}
            <AnimatePresence>
                {(editingTask || addingDate) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); }}
                    >
                        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <TaskInput
                                onClose={() => { setEditingTask(null); setAddingDate(null); }}
                                initialData={editingTask || undefined}
                                defaultDate={addingDate || undefined}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
