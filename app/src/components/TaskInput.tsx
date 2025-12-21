"use client";

import { useState, useMemo, useEffect } from 'react';
import { useStore, Task, Priority, Category } from '@/lib/store';
import { X, Clock, Repeat, AlertCircle, Calendar as CalendarIcon, GraduationCap, Link2, Trash2, AlertTriangle, Bell, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMinutesUntil } from '@/lib/planner';
import { CATEGORY_CONFIG } from './CategoryTabs';

interface TaskInputProps {
    onClose?: () => void;
    initialData?: Task; // If provided, we are in Edit Mode
    defaultDate?: string; // For pre-filling date in Add Mode
    defaultType?: 'task' | 'break' | 'reminder' | 'study';
}

export default function TaskInput({ onClose, initialData, defaultDate, defaultType = 'task' }: TaskInputProps) {
    const addTask = useStore((state) => state.addTask);
    const updateTask = useStore((state) => state.updateTask);
    const generateStudyPlan = useStore((state) => state.generateStudyPlan);
    const tasks = useStore((state) => state.tasks);
    const workEndTime = useStore((state) => state.workEndTime);

    // State initialization
    const [title, setTitle] = useState(initialData?.title || '');
    const [duration, setDuration] = useState(initialData?.duration?.toString() || '60');
    const [priority, setPriority] = useState<Priority>(initialData?.priority || 'must');
    const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | ''>(initialData?.recurrence || '');
    const [type, setType] = useState<'task' | 'break' | 'reminder' | 'study'>(
        (initialData?.type === 'focus' ? 'task' : initialData?.type) || defaultType
    );
    const [startTime, setStartTime] = useState(initialData?.startTime || '');
    const [category, setCategory] = useState<Category>(initialData?.category || 'other');

    // Reminder State
    const [alertTime, setAlertTime] = useState<any>(initialData?.alertTime || 'at_event');
    const [sound, setSound] = useState<any>(initialData?.sound || 'default');
    const [visualRequest, setVisualRequest] = useState<any>(initialData?.visualRequest || 'both');
    const [actionLink, setActionLink] = useState(initialData?.actionLink || '');
    const [autoOpenLink, setAutoOpenLink] = useState(initialData?.autoOpenLink || false);

    // Smart Study State
    const [studyDays, setStudyDays] = useState<number[]>([0, 1, 2, 3, 4]); // Sun-Thu default
    const [studyStartDate, setStudyStartDate] = useState('');
    const [studyDeadline, setStudyDeadline] = useState('');
    const [replaceTitle, setReplaceTitle] = useState<string | null>(null);

    // Explicit Date management (for Reminders/Study particularly, ensuring defaults to selected or today)
    // To allow picking a date, we need local state initialized from initialData or store.
    const selectedDate = useStore(state => state.selectedDate);
    const [scheduledDate, setScheduledDate] = useState(initialData?.scheduledDate || defaultDate || selectedDate);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        // If user switched to 'study' mode explicitly (Regeneration), treat as ADD mode even if initialData exists
        if (initialData && type !== 'study') {
            // Update Mode
            updateTask(initialData.id, {
                title,
                duration: parseInt(duration),
                priority,
                recurrence: recurrence || undefined,
                startTime: startTime || undefined,
                scheduledDate: scheduledDate, // Fix: Pass the locally selected date
                category: category || undefined,
                alertTime: type === 'reminder' ? alertTime : undefined,
                sound: type === 'reminder' ? sound : undefined,
                visualRequest: type === 'reminder' ? visualRequest : undefined,
                actionLink: type === 'reminder' ? actionLink : undefined,
                autoOpenLink: type === 'reminder' ? autoOpenLink : undefined
            });
            if (onClose) onClose();
        } else {
            // Add Mode
            if (type === 'study') {
                if (!studyStartDate || !studyDeadline && !scheduledDate) {
                    alert('אנא בחר תאריך התחלה ותאריך יעד');
                    return;
                }
                generateStudyPlan({
                    title,
                    deadline: studyDeadline || scheduledDate,
                    startDate: studyStartDate,
                    sessionDuration: parseInt(duration),
                    selectedDays: studyDays,
                    examAlert: alertTime,
                    replaceTitle: replaceTitle || undefined
                });
            } else {
                if (type === 'reminder' && !startTime) {
                    alert('אנא בחר שעה לתזכורת');
                    return;
                }
                addTask({
                    title,
                    duration: parseInt(duration),
                    priority,
                    recurrence: recurrence || undefined,
                    type,
                    startTime: startTime || undefined,
                    scheduledDate: scheduledDate, // Fix: Pass the locally selected date
                    category: category || 'other',
                    alertTime: type === 'reminder' ? alertTime : undefined,
                    sound: type === 'reminder' ? sound : undefined,
                    visualRequest: type === 'reminder' ? visualRequest : undefined,
                    actionLink: type === 'reminder' ? actionLink : undefined,
                    autoOpenLink: type === 'reminder' ? autoOpenLink : undefined
                });
            }

            // Reset for batch entry only if NOT editing
            setTitle('');
            setDuration(type === 'break' ? '15' : '60');
            setRecurrence('');
            setStartTime('');
            setCategory('other');
            setActionLink('');
            setAutoOpenLink(false);
            setScheduledDate(selectedDate); // Reset to today/viewed date
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
                    <span>
                        {initialData ? 'עריכת' : 'הוספת'} {
                            type === 'study' ? 'תוכנית למידה' :
                                (category === 'study' && initialData) ? 'סשן למידה' :
                                    type === 'task' ? 'משימה' :
                                        type === 'break' ? 'הפסקה' :
                                            'תזכורת'
                        }
                    </span>
                </div>
                {!initialData && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button type="button" onClick={() => { setType('task'); setDuration('60'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'task' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>משימה</button>
                        <button type="button" onClick={() => { setType('break'); setDuration('15'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'break' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>הפסקה</button>
                        <button type="button" onClick={() => { setType('reminder'); setDuration('0'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'reminder' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>תזכורת</button>
                        <button type="button" onClick={() => { setType('study'); setDuration('60'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'study' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>למידה חכמה</button>
                    </div>
                )}
                {initialData && category === 'study' && type !== 'study' && (
                    <button
                        type="button"
                        onClick={() => {
                            setType('study');
                            // Heuristic: Try to start a new plan based on this task
                            setStudyDeadline(scheduledDate);
                            const cleanTitle = title.replace('📚 למידה: ', '').replace('🏆 ', '');
                            setTitle(cleanTitle);
                            setReplaceTitle(cleanTitle); // Store old title for deletion
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                        <GraduationCap size={12} />
                        רוצה לתכנן מחדש את כל הלמידה? לחץ כאן
                    </button>
                )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... existing fields ... */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">שם {type === 'task' ? 'המשימה' : type === 'break' ? 'ההפסקה' : 'התזכורת'}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={type === 'break' ? "קפה, מנוחה..." : type === 'reminder' ? "לשתות מים, לשלם חשבון..." : "מה צריך לעשות?"}
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

                {/* Duration - Only for Task/Break */}
                {type !== 'reminder' && (
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
                    </div>
                )}

                {/* Smart Study Settings */}
                {type === 'study' && (
                    <div className="space-y-4 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    תאריך יעד (מבחן)
                                </label>
                                <input
                                    type="date"
                                    value={studyDeadline}
                                    onChange={(e) => setStudyDeadline(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    מתי מתחילים ללמוד?
                                </label>
                                <input
                                    type="date"
                                    value={studyStartDate}
                                    onChange={(e) => setStudyStartDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                ימי לימוד בשבוע
                            </label>
                            <div className="flex justify-between gap-1">
                                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, idx) => {
                                    const isSelected = studyDays.includes(idx);
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) setStudyDays(prev => prev.filter(d => d !== idx));
                                                else setStudyDays(prev => [...prev, idx]);
                                            }}
                                            className={cn(
                                                "w-8 h-8 rounded-full text-xs font-bold transition-all",
                                                isSelected
                                                    ? "bg-indigo-600 text-white shadow-md scale-110"
                                                    : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-indigo-50"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Clock size={14} /> זמן לימוד יומי (דקות)
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                        </div>
                    </div>
                )}

                {/* Reminder Settings */}
                {type === 'reminder' && (
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                    <Bell size={14} /> מתי להזכיר?
                                </label>
                                <select
                                    value={alertTime}
                                    onChange={(e) => setAlertTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                >
                                    <option value="at_event">בזמן האירוע</option>
                                    <option value="5_min_before">5 דקות לפני</option>
                                    <option value="15_min_before">15 דקות לפני</option>
                                    <option value="30_min_before">30 דקות לפני</option>
                                    <option value="1_hour_before">שעה לפני</option>
                                    <option value="1_day_before">יום לפני</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                    <AlertCircle size={14} /> צליל
                                </label>
                                <select
                                    value={sound}
                                    onChange={(e) => setSound(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                >
                                    <option value="default">רגיל 🔔</option>
                                    <option value="subtle">עדין 🍃</option>
                                    <option value="energetic">אנרגטי ⚡</option>
                                    <option value="none">ללא צליל 🔕</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Link2 size={14} /> קישור לפעולה (למשל: למסך תשלום)
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={actionLink}
                                    onChange={(e) => setActionLink(e.target.value)}
                                    placeholder="https://zoom.us/..."
                                    className="w-full px-3 py-2 pl-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all direction-ltr text-left"
                                />
                                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">בלחיצה על התזכורת, הקישור ייפתח אוטומטית.</p>

                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="autoOpen"
                                    checked={autoOpenLink}
                                    onChange={(e) => setAutoOpenLink(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label htmlFor="autoOpen" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                    פתח קישור אוטומטית כשהתזכורת קופצת
                                </label>
                            </div>
                        </div>

                        {/* Date Picker for Reminder */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <CalendarIcon size={14} /> תאריך ושעה
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono text-sm"
                                />
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ltr font-mono text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">

                    {type !== 'reminder' && (
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
                    )}

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
                            {type === 'task' ? 'הוסף לרשימה' : type === 'break' ? 'שבץ הפסקה' : type === 'study' ? 'צור למידה חכמה' : 'קבע תזכורת'}
                        </>
                    )}
                </button>

                {initialData && (initialData.groupId || (category === 'study' && (title.includes('🏆') || title.includes('📚')))) ? (
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('בטוח שאתה רוצה למחוק את כל הקורס הזה? (כל המשימות הקשורות אליו יימחקו)')) {
                                if (initialData.groupId) {
                                    useStore.getState().deleteTaskGroup(initialData.groupId);
                                } else {
                                    // Fallback for legacy data
                                    useStore.getState().deleteStudyGroupByTitle(title);
                                }
                                if (onClose) onClose();
                            }
                        }}
                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <Trash2 size={14} />
                        מחק את כל הקורס
                    </button>
                ) : initialData && (
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm('למחוק את המשימה הזאת?')) {
                                useStore.getState().deleteTask(initialData.id);
                                if (onClose) onClose();
                            }
                        }}
                        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <Trash2 size={14} />
                        מחק משימה
                    </button>
                )}

                {shouldShowOverloadAlert}
            </form>
        </div >
    );
}
