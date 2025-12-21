"use client";

import { Task } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Bell, Trash2, CheckCircle, GripVertical, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface ReminderCardProps {
    task: Task;
    isOverlay?: boolean;
    isActive?: boolean;
    isDragging?: boolean;
    style?: React.CSSProperties;
    listeners?: any;
    attributes?: any;
    toggleTaskCompletion: (id: string) => void;
    deleteTask: (id: string) => void;
    setEditingTask: (id: string | null) => void;
}

export const ReminderCard = forwardRef<HTMLDivElement, ReminderCardProps>(({
    task,
    isOverlay,
    isActive,
    isDragging,
    style,
    listeners,
    attributes,
    toggleTaskCompletion,
    deleteTask,
    setEditingTask,
}, ref) => {

    const soundIcon = {
        'default': '🔔',
        'subtle': '🍃',
        'energetic': '⚡',
        'none': '🔕'
    }[task.sound || 'default'];

    return (
        <div
            ref={ref}
            style={style}
            {...attributes}
            className={cn(
                "mb-3 outline-none transition-all",
                isDragging && "opacity-30 z-50",
                isOverlay && "z-50"
            )}
        >
            <motion.div
                initial={isOverlay ? undefined : { opacity: 0, y: 20, scale: 0.95 }}
                animate={isOverlay ? undefined : { opacity: 1, y: 0, scale: 1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "group relative flex items-center gap-3 w-full p-3 rounded-2xl shadow-sm border transition-all overflow-hidden",
                    "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30",
                    task.completed && "opacity-60 grayscale bg-slate-50 dark:bg-slate-800/50 border-slate-100",
                    isOverlay ? "shadow-2xl rotate-1 bg-white dark:bg-slate-800" : "hover:shadow-md",
                    isActive && "ring-2 ring-amber-400 shadow-xl shadow-amber-500/20"
                )}
            >
                {/* Drag Handle */}
                <div
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 text-black/20 hover:text-black/50 dark:text-white/20 dark:hover:text-white/50 flex-shrink-0 transition-colors"
                >
                    <GripVertical size={18} />
                </div>

                {/* Icon */}
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
                    <Bell size={16} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                        <span className={cn(
                            "font-bold text-sm text-slate-800 dark:text-slate-100 truncate",
                            task.completed && "line-through text-slate-500"
                        )}>
                            {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-slate-500 font-mono">
                            <span>{soundIcon}</span>
                            {task.alertTime && <span>{task.alertTime.replace(/_/g, ' ')}</span>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={cn(
                    "flex items-center gap-1 transition-opacity",
                    "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                )}>
                    {task.actionLink && (
                        <a
                            href={task.actionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                            title="פתח קישור"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink size={16} />
                        </a>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); setEditingTask(task.id); }}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(task.id); }}
                        className={cn(
                            "p-1.5 rounded-full transition-colors",
                            task.completed ? "text-green-500 bg-green-100 dark:bg-green-900/30" : "text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30"
                        )}
                    >
                        <CheckCircle size={16} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
});

ReminderCard.displayName = "ReminderCard";
