import { useStore, Task } from '@/lib/store';
import TaskBlock from './TaskBlock';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useState, useRef, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { TaskCardOverlay } from './TaskCardOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Sun, Moon, Sunset, CalendarCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    tasks: Task[];
}

const getTimeBlock = (t: Task) => {
    if (!t.startTime) return 'anytime';
    const hour = parseInt(t.startTime.split(':')[0]);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 20) return 'evening';
    return 'night';
};

const BLOCK_CONFIG = {
    morning: { label: 'בוקר', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    afternoon: { label: 'צהריים', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-500/10' }, // Sun again or maybe distinct?
    evening: { label: 'ערב', icon: Sunset, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    night: { label: 'לילה', icon: Moon, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    anytime: { label: 'ללא שעה', icon: Coffee, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' }
};

export default function Timeline({ tasks }: Props) {
    const reorderTasks = useStore((state) => state.reorderTasks);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragWidth, setDragWidth] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } });
    const keyboardSensor = useSensor(KeyboardSensor);
    const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        if (containerRef.current) setDragWidth(containerRef.current.offsetWidth);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = tasks.findIndex((t) => t.id === active.id);
            const newIndex = tasks.findIndex((t) => t.id === over.id);
            const newOrder = arrayMove(tasks, oldIndex, newIndex);
            reorderTasks(newOrder);
        }
        setActiveId(null);
        setDragWidth(null);
    };

    // --- Time Block Logic ---
    // We categorize tasks to insert headers.
    // Since dnd-kit requires a flat list for sorting, we will render the header *as part of* the item mapping
    // based on whether it's the first item of that block.



    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 shadow-sm border border-white/20">
                    <CalendarCheck size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">היומן שלך פנוי!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                    זה זמן מצוין לנוח, ללמוד משהו חדש, או לתכנן את המהלך הבא שלך.
                </p>
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div ref={containerRef} className="pb-20"> {/* Padding for bottom scroll */}
                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                        {tasks.map((task, index) => {
                            const block = getTimeBlock(task);
                            const prevBlock = index > 0 ? getTimeBlock(tasks[index - 1]) : null;
                            const showHeader = block !== prevBlock;
                            const BlockIcon = BLOCK_CONFIG[block as keyof typeof BLOCK_CONFIG].icon;
                            const blockLabel = BLOCK_CONFIG[block as keyof typeof BLOCK_CONFIG].label;

                            return (
                                <div key={task.id + 'wrap'}>
                                    {showHeader && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 mt-6 mb-3 px-2 first:mt-0"
                                        >
                                            <div className={cn("p-1.5 rounded-lg", BLOCK_CONFIG[block as keyof typeof BLOCK_CONFIG].bg)}>
                                                <BlockIcon size={14} className={BLOCK_CONFIG[block as keyof typeof BLOCK_CONFIG].color} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{blockLabel}</span>
                                            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
                                        </motion.div>
                                    )}

                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }} // Staggered entry
                                    >
                                        <TaskBlock key={task.id} task={task} />
                                    </motion.div>
                                </div>
                            );
                        })}
                    </AnimatePresence>
                </SortableContext>

                <DragOverlay>
                    {activeTask ? (
                        <div style={{ width: dragWidth ? `${dragWidth}px` : 'auto' }}>
                            <TaskCardOverlay task={activeTask} />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
