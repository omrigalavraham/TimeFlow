"use client";

import { useStore, Task } from '@/lib/store'; // Import Task type
import TaskBlock from './TaskBlock';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useState, useRef } from 'react';

interface Props {
    tasks: Task[];
}

export default function Timeline({ tasks }: Props) {
    const reorderTasks = useStore((state) => state.reorderTasks);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragWidth, setDragWidth] = useState<number | null>(null);
    const columnRef = useState<HTMLDivElement | null>(null); // Use callback ref or simple ref? Simple ref is fine if component doesn't unmount/remount weirdly.
    // Actually, useRef is better.
    const containerRef = useRef<HTMLDivElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (prevents accidental clicks)
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Long press (250ms) to start drag on touch
                tolerance: 5, // Allow 5px movement during delay
            },
        }),
        useSensor(KeyboardSensor)
    );

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        if (containerRef.current) {
            setDragWidth(containerRef.current.offsetWidth);
        }
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

    if (tasks.length === 0) {
        return (
            <div className="text-center py-20 text-slate-400">
                <p>אין משימות ליום זה. 🎉</p>
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
            <div
                ref={containerRef}
                className="bg-slate-50/50 dark:bg-slate-900/50 p-2 md:p-4 rounded-xl min-h-[500px]"
            >
                {/* Visual day indicator or just title */}

                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskBlock key={task.id} task={task} />
                    ))}
                </SortableContext>

                <DragOverlay>
                    {activeTask ? (
                        <div style={{ width: dragWidth ? `${dragWidth}px` : 'auto' }}>
                            <TaskBlock task={activeTask} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
