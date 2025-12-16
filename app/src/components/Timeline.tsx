"use client";

import { useStore, Task } from '@/lib/store'; // Import Task type
import TaskBlock from './TaskBlock';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useState, useRef } from 'react';

interface Props {
    tasks: Task[];
}

import { TaskCard } from './TaskCard'; // Import TaskCard

// Helper for Overlay
const TaskCardOverlay = ({ task }: { task: Task }) => {
    const {
        toggleTaskCompletion,
        deleteTask,
        activeTaskId,
        setActiveTask,
        moveTaskToDate,
        setEditingTask,
        openCompletionModal
    } = useStore();

    // Mock handler for date move in overlay
    const handleMoveToTomorrow = (id: string) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        moveTaskToDate(id, tomorrow.toISOString().split('T')[0]);
    }

    return (
        <TaskCard
            task={task}
            isOverlay
            isActive={activeTaskId === task.id}
            toggleTaskCompletion={toggleTaskCompletion}
            deleteTask={deleteTask}
            setActiveTask={setActiveTask}
            moveTaskToDate={handleMoveToTomorrow}
            setEditingTask={setEditingTask}
            openCompletionModal={openCompletionModal}
        />
    )
}

export default function Timeline({ tasks }: Props) {
    // ... existing hook setup ...
    const reorderTasks = useStore((state) => state.reorderTasks);
    // ...

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
                <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskBlock key={task.id} task={task} />
                    ))}
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
