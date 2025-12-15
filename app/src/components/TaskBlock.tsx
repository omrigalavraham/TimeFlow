"use client";

import { Task, useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Trash2, CheckCircle, GripVertical, Play, ArrowRightCircle, Repeat, Clock, Coffee } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';

interface Props {
    task: Task;
    isOverlay?: boolean;
}

const getTaskColor = (id: string) => {
    const colors = [
        'bg-rose-100 dark:bg-rose-900/20',
        'bg-orange-100 dark:bg-orange-900/20',
        'bg-amber-100 dark:bg-amber-900/20',
        'bg-emerald-100 dark:bg-emerald-900/20',
        'bg-cyan-100 dark:bg-cyan-900/20',
        'bg-blue-100 dark:bg-blue-900/20',
        'bg-indigo-100 dark:bg-indigo-900/20',
        'bg-violet-100 dark:bg-violet-900/20',
        'bg-fuchsia-100 dark:bg-fuchsia-900/20',
    ];
    // Simple hash
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
        case 'must': return 'bg-red-500 shadow-red-500/50';
        case 'should': return 'bg-amber-500 shadow-amber-500/50'; // Changing Should to Amber for better contrast with Red? Or keep Teal? User only asked for Red for urgent. I'll keep Teal or maybe Orange? Let's stick to user request Red for Must. Actually, Traffic light logic (Red/Yellow/Green) is popular. Let's make Should Orange/Amber and Could Green/Blue? 
        // User request: "Change the indication colors so red blinking is the urgent". 
        // I will change Must to Red. I'll leave others or maybe tweak slightly for harmony.
        // Let's go with Red / Blue / Gray for now to be safe, or Red / Teal / Gray.
        case 'should': return 'bg-blue-500 shadow-blue-500/50';
        case 'could': return 'bg-slate-400 shadow-slate-400/50';
    }
}

export default function TaskBlock({ task, isOverlay }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: task });
    const toggleTaskCompletion = useStore((state) => state.toggleTaskCompletion);
    const deleteTask = useStore((state) => state.deleteTask);
    const scheduleTasks = useStore((state) => state.scheduleTasks);
    // Active Task Check
    const activeTaskId = useStore((state) => state.activeTaskId);
    const isActive = activeTaskId === task.id;

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const taskColor = task.type === 'break'
        ? "bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30"
        : getTaskColor(task.id);

    // Logic for Priority Light
    let priorityLight = getPriorityColor(task.priority);
    let shouldBlink = true;

    if (task.completed) {
        priorityLight = 'bg-green-500 shadow-green-500/50';
        shouldBlink = false;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                "group relative flex items-center gap-4 mb-3 transition-all outline-none",
                isDragging && "opacity-30",
                isOverlay && "z-50 scale-105",
                isActive && "scale-[1.02]" // Slight scale for active task
            )}
        >
            {/* Priority Light -- OUTSIDE the row (Hidden for breaks) */}
            {task.type !== 'break' ? (
                <div className="flex-shrink-0 relative flex items-center justify-center w-4 h-4">
                    {/* Ping Effect (Only if failing/urgent/active, i.e., not completed) */}
                    {(shouldBlink || isActive) && (
                        <div className={cn(
                            "absolute inset-0 rounded-full animate-ping opacity-75",
                            priorityLight
                        )} />
                    )}
                    {/* The Dot itself */}
                    <div className={cn(
                        "relative w-3 h-3 rounded-full shadow-lg ring-2 ring-white dark:ring-slate-900 transition-colors duration-500",
                        priorityLight
                    )} />
                </div>
            ) : (
                <div className="w-4 flex justify-center text-teal-500 opacity-50"><Coffee size={14} /></div>
            )}

            {/* The Colored Task Row */}
            <div className={cn(
                "flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 md:p-4 rounded-2xl shadow-sm border border-transparent transition-all overflow-hidden",
                taskColor,
                task.completed && "opacity-60 grayscale",
                isOverlay ? "shadow-2xl rotate-1 bg-white dark:bg-slate-800" : "hover:shadow-md hover:border-black/5 dark:hover:border-white/10",
                isActive && task.type !== 'break' && "ring-2 ring-purple-600 shadow-xl shadow-purple-500/20 animate-pulse bg-white/50"
            )}>

                {/* Mobile Top Row: Handle + Content */}
                <div className="flex items-start gap-3 w-full">
                    {/* Grip Handle (Desktop: Left, Mobile: Top-Left) */}
                    <div
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 mt-1 md:mt-0 text-black/20 hover:text-black/50 dark:text-white/20 dark:hover:text-white/50 flex-shrink-0 transition-colors"
                    >
                        <GripVertical size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1">
                            {/* Title - Full wrap on mobile */}
                            <span
                                className={cn(
                                    "font-bold text-lg leading-snug block text-slate-800 dark:text-slate-100 break-words whitespace-normal",
                                    task.completed && "line-through text-slate-500",
                                    task.type === 'break' && "text-teal-700 dark:text-teal-200"
                                )}
                                title={task.title}
                            >
                                {task.title}
                            </span>

                            {/* Start Time Badge */}
                            {task.startTime && (
                                <span className="self-start md:self-auto text-xs font-mono font-black text-slate-600 dark:text-slate-400 bg-white/40 dark:bg-black/20 px-2 py-1 rounded-md md:ml-2 whitespace-nowrap backdrop-blur-sm">
                                    {task.startTime}
                                </span>
                            )}
                        </div>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600/70 dark:text-slate-300/70 mt-2">
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {task.duration} דק׳
                            </span>

                            {task.recurrence && (
                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded text-[11px]">
                                    <Repeat size={12} />
                                    {task.recurrence === 'daily' ? 'יומי' : 'שבועי'}
                                </span>
                            )}

                            {task.type === 'break' && (
                                <span className="text-teal-600 text-xs bg-teal-100 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">
                                    מנוחה
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Toolbar (Mobile: Bottom Row, Desktop: Right Side) */}
                <div className={cn(
                    "flex items-center justify-end gap-2 pt-3 mt-1 border-t border-black/5 md:border-0 md:pt-0 md:mt-0 md:bg-white/50 md:dark:bg-black/20 md:p-1 md:rounded-full md:backdrop-blur-sm transition-opacity",
                    "opacity-100 md:opacity-0 md:group-hover:opacity-100" // Always visible on mobile
                )}>
                    {task.type !== 'break' && !task.completed && (
                        <>
                            {/* Move to Tomorrow */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);
                                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                                    useStore.getState().moveTaskToDate(task.id, tomorrowStr);
                                }}
                                className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-full transition-all shadow-sm active:scale-95 md:hover:scale-110"
                                title="העבר למחר"
                            >
                                <ArrowRightCircle size={20} />
                            </button>

                            {/* Focus Mode */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    useStore.getState().setActiveTask(task.id);
                                }}
                                className="p-2 hover:bg-white dark:hover:bg-slate-700 text-purple-600 dark:text-purple-400 rounded-full transition-all shadow-sm active:scale-95 md:hover:scale-110"
                                title="כנס לפוקוס"
                            >
                                <Play size={20} className="fill-current" />
                            </button>
                        </>
                    )}

                    {/* Complete Button */}
                    {task.type !== 'break' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!task.completed) {
                                    useStore.getState().openCompletionModal(task.id);
                                } else {
                                    toggleTaskCompletion(task.id);
                                }
                            }}
                            className={cn(
                                "p-2 rounded-full transition-all shadow-sm active:scale-95 md:hover:scale-110",
                                task.completed
                                    ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                                    : "text-slate-500 hover:text-green-600 hover:bg-white dark:hover:bg-slate-700"
                            )}
                        >
                            <CheckCircle size={20} />
                        </button>
                    )}

                    {/* Delete Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all shadow-sm active:scale-95 md:hover:scale-110"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
