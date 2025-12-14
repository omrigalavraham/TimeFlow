"use client";

import { useState } from 'react';
import { useStore, Priority } from '@/lib/store';
import { Plus, Clock, AlertCircle, Repeat, Coffee, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskInputProps {
    onClose?: () => void;
}

export default function TaskInput({ onClose }: TaskInputProps) {
    const addTask = useStore((state) => state.addTask);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('60');
    const [priority, setPriority] = useState<Priority>('must');
    const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | ''>('');
    const [type, setType] = useState<'task' | 'break'>('task');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        addTask({
            title,
            duration: parseInt(duration),
            priority,
            recurrence: recurrence || undefined,
            type
        });

        setTitle('');
        setDuration(type === 'break' ? '15' : '60');
        setRecurrence('');
        // Keep priority as is or reset? Let's keep it for batch entry.

        // Optional: Close on submit? Or keep open for batch?
        // User didn't specify, but "Add Task" usually implies single shot if it's a modal/collapsible.
        // Let's NOT close automatically for now to allow batch entry unless user asks.
    };

    return (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors relative">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 -m-4 mb-4 p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={18} className="text-slate-500" />
                        </button>
                    )}
                    <span>הוספת {type === 'task' ? 'משימה' : 'הפסקה'}</span>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => { setType('task'); setDuration('60'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'task' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>משימה</button>
                    <button onClick={() => { setType('break'); setDuration('15'); }} className={cn("text-xs px-3 py-1 rounded-md transition-all", type === 'break' ? "bg-white dark:bg-slate-700 shadow-sm" : "opacity-50")}>הפסקה</button>
                </div>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    {type === 'task' ? <Plus size={18} /> : <Coffee size={18} />}
                    {type === 'task' ? 'הוסף לרשימה' : 'שבץ הפסקה'}
                </button>
            </form>
        </div>
    );
}
