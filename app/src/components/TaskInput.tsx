"use client";

import { useState, useMemo } from 'react';
import { useStore, Priority, Category } from '@/lib/store';
import { Plus, Clock, AlertCircle, Repeat, Coffee, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMinutesUntil } from '@/lib/planner';
import { CATEGORY_CONFIG } from './CategoryTabs';

import { Task } from '@/lib/store';

interface TaskInputProps {
    onClose?: () => void;
    initialData?: Task; // If provided, we are in Edit Mode
}

export default function TaskInput({ onClose, initialData }: TaskInputProps) {
    const addTask = useStore((state) => state.addTask);
    const updateTask = useStore((state) => state.updateTask);
    const tasks = useStore((state) => state.tasks);
    const workEndTime = useStore((state) => state.workEndTime);

    // State initialization
    const [title, setTitle] = useState(initialData?.title || '');
    const [duration, setDuration] = useState(initialData?.duration?.toString() || '60');
    const [priority, setPriority] = useState<Priority>(initialData?.priority || 'must');
    const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | ''>(initialData?.recurrence || '');
    const [type, setType] = useState<'task' | 'break'>(initialData?.type || 'task');
    const [startTime, setStartTime] = useState(initialData?.startTime || '');
    const [category, setCategory] = useState<Category>(initialData?.category || 'other');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        if (initialData) {
            // Update Mode
            updateTask(initialData.id, {
                title,
                duration: parseInt(duration),
                priority,
                recurrence: recurrence || undefined,
                startTime: startTime || undefined,
                category: category || undefined
            });
            if (onClose) onClose();
        } else {
            // Add Mode
            addTask({
                title,
                duration: parseInt(duration),
                priority,
                recurrence: recurrence || undefined,
                type,
                startTime: startTime || undefined,
                category: category || 'other'
            });

            // Reset for batch entry only if NOT editing
            setTitle('');
            setDuration(type === 'break' ? '15' : '60');
            setRecurrence('');
            setStartTime('');
            setCategory('other');
        }
    };

    // Reality Check Calculation
    const shouldShowOverloadAlert = useMemo(() => {
        if (!workEndTime || parseInt(duration) <= 0) return null;

        const tasksMins = tasks.filter(t => !t.completed).reduce((acc, t) => acc + t.duration, 0);
        const newTotal = tasksMins + parseInt(duration);
        const available = getMinutesUntil(workEndTime);

        if (newTotal > available) {
            return (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-0.5">שים לב! זה יוצר חריגה.</span>
                        זה יגרום לך לסיים אחרי {workEndTime}. כדאי לשקול להעביר משהו אחר למחר.
                    </div>
                </div>
            );
        }
        return null;
    }, [workEndTime, duration, tasks]);

    return (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors relative">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 -m-4 mb-4 p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={18} className="text-slate-500" />
                        </button>
                    )}
                    <span>{initialData ? 'עריכת' : 'הוספת'} {type === 'task' ? 'משימה' : 'הפסקה'}</span>
                </div>
                {!initialData && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button type="button" onClick={() => { setType('task'); setDuration('60'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'task' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>משימה</button>
                        <button type="button" onClick={() => { setType('break'); setDuration('15'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'break' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>הפסקה</button>
                    </div>
                )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... existing fields ... */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">שם {type === 'task' ? 'המשימה' : 'ההפסקה'}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={type === 'break' ? "קפה, מנוחה..." : "מה צריך לעשות?"}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                </div>
                {/* ... Category Selector ... */}
                {type === 'task' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">קטגוריה</label>
                        <div className="flex flex-wrap gap-2">
                            {(Object.keys(CATEGORY_CONFIG) as Array<Category | 'all'>)
                                .filter(c => c !== 'all')
                                .map(cat => {
                                    const config = CATEGORY_CONFIG[cat];
                                    const Icon = config.icon;
                                    const isSelected = category === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat as Category)}
                                            className={cn(
                                                "p-2 rounded-lg transition-all border relative group",
                                                isSelected
                                                    ? cn("border-transparent ring-2 ring-offset-1 ring-slate-200 dark:ring-slate-700", config.color)
                                                    : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-100"
                                            )}
                                        >
                                            <Icon size={18} />
                                            {/* Custom Tooltip */}
                                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                {config.label}
                                            </span>
                                        </button>
                                    )
                                })}
                        </div>
                    </div>
                )}
                {/* ... Rest of fields ... */}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Clock size={14} /> משך זמן (דק')
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Clock size={14} /> שעה (אופציונלי)
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Repeat size={14} /> חזרתיות
                        </label>
                        <select
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        >
                            <option value="">ללא חזרה</option>
                            <option value="daily">כל יום</option>
                            <option value="weekly">כל שבוע</option>
                        </select>
                    </div>

                    {type === 'task' && (
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <AlertCircle size={14} /> דחיפות
                            </label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                {(['must', 'should', 'could'] as Priority[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={cn(
                                            "flex-1 text-xs font-medium py-1.5 rounded-md capitalize transition-all",
                                            priority === p
                                                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                        )}
                                    >
                                        {p === 'must' ? 'חובה' : p === 'should' ? 'כדאי' : 'אולי'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-slate-900 dark:bg-slate-700 text-white py-2.5 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                    {initialData ? (
                        'שמור שינויים'
                    ) : (
                        <>
                            {type === 'task' ? 'הוסף לרשימה' : 'שבץ הפסקה'}
                        </>
                    )}
                </button>

                {shouldShowOverloadAlert}
            </form>
        </div>
    );
}
