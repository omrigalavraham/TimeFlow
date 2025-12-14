"use client";

import { useStore, Task } from '@/lib/store'; // Import Task type
import TaskBlock from './TaskBlock';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';

interface Props {
    tasks: Task[];
}

export default function Timeline({ tasks }: Props) {
    const reorderTasks = useStore((state) => state.reorderTasks);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
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
            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2 md:p-4 rounded-xl min-h-[500px]">
                {/* Visual day indicator or just title */}

                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskBlock key={task.id} task={task} />
                    ))}
                </SortableContext>

                <DragOverlay>
                    {activeTask ? <TaskBlock task={activeTask} isOverlay /> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
