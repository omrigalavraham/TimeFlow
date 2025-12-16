"use client";

import { Task, useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Trash2, CheckCircle, GripVertical, Play, ArrowRightCircle, Repeat, Clock, Coffee } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { CATEGORY_CONFIG } from './CategoryTabs';

interface Props {
    task: Task;
    isOverlay?: boolean;
}

const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
        case 'must': return 'bg-red-500 shadow-red-500/50';
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

    // Resolve Category Config
    const categoryKey = task.category || 'other';
    const catConfig = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG['other'];
    const CategoryIcon = catConfig.icon;

    // Define background based on category
    // We map category to specific bg/border colors, slightly lighter than the active tab colors for content background
    const getCategoryStyles = (cat: string) => {
        switch (cat) {
            case 'work': return "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30";
            case 'study': return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30";
            case 'home': return "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30";
            case 'health': return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30";
            case 'social': return "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30";
            default: return "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700";
        }
    }

    const taskColor = task.type === 'break'
        ? "bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/30"
        : getCategoryStyles(categoryKey);

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
                "mb-3 outline-none transition-all",
                isDragging && "opacity-30 z-50",
                isOverlay && "z-50"
            )}
        >
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "group relative flex items-center gap-4 w-full",
                    isOverlay && "scale-105",
                    isActive && "scale-[1.02]"
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

                                {task.type === 'break' ? (
                                    <span className="text-teal-600 text-xs bg-teal-100 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">
                                        מנוחה
                                    </span>
                                ) : (
                                    // Category Badge
                                    <span className={cn(
                                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] opacity-80",
                                        catConfig?.color ? catConfig.color.replace('text-', 'text-').replace('bg-', 'bg-opacity-50 bg-') : "bg-slate-100"
                                    )}>
                                        {CategoryIcon && <CategoryIcon size={12} />}
                                        {catConfig?.label}
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

                                {/* Edit Button - NEW */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        useStore.getState().setEditingTask(task.id);
                                    }}
                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-full transition-all shadow-sm active:scale-95 md:hover:scale-110"
                                    title="ערוך משימה"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                </button>
                            </>
                        )}

                        {/* Focus Mode vs Start Break (Available for all uncompleted) */}
                        {!task.completed && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    useStore.getState().setActiveTask(task.id);
                                }}
                                className={cn(
                                    "p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all shadow-sm active:scale-95 md:hover:scale-110",
                                    task.type === 'break' ? "text-teal-600 dark:text-teal-400" : "text-purple-600 dark:text-purple-400"
                                )}
                                title={task.type === 'break' ? "התחל הפסקה" : "כנס לפוקוס"}
                            >
                                {task.type === 'break' ? <Coffee size={20} /> : <Play size={20} className="fill-current" />}
                            </button>
                        )}

                        {/* Complete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!task.completed) {
                                    if (task.type === 'break') {
                                        // Visual Feedback for Break Completion
                                        confetti({
                                            particleCount: 50,
                                            spread: 60,
                                            origin: { y: 0.7 },
                                            colors: ['#2dd4bf', '#0d9488'] // Teal colors
                                        });
                                        toggleTaskCompletion(task.id);
                                    } else {
                                        useStore.getState().openCompletionModal(task.id);
                                    }
                                } else {
                                    toggleTaskCompletion(task.id);
                                }
                            }}
                            className={cn(
                                "p-2 rounded-full transition-all shadow-sm active:scale-95 md:hover:scale-110",
                                task.completed
                                    ? (task.type === 'break' ? "text-teal-600 bg-teal-100 dark:bg-teal-900/30" : "text-green-600 bg-green-100 dark:bg-green-900/30")
                                    : "text-slate-500 hover:text-green-600 hover:bg-white dark:hover:bg-slate-700"
                            )}
                            title={task.completed ? "סמן כלא הושלם" : "סמן כהושלם"}
                        >
                            <CheckCircle size={20} />
                        </button>

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
            </motion.div>
        </div>
    );
}
