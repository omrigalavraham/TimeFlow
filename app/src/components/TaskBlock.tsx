"use client";

import { Task, useStore } from '@/lib/store';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';
import { ReminderCard } from './ReminderCard';

interface Props {
    task: Task;
    isOverlay?: boolean;
}

import { memo } from 'react';

const TaskBlock = memo(function TaskBlock({ task, isOverlay }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: task });

    // Store Actions
    // Store Actions - Stable selectors
    const toggleTaskCompletion = useStore(s => s.toggleTaskCompletion);
    const deleteTask = useStore(s => s.deleteTask);
    const setActiveTask = useStore(s => s.setActiveTask);
    const moveTaskToDate = useStore(s => s.moveTaskToDate);
    const setEditingTask = useStore(s => s.setEditingTask);
    const openCompletionModal = useStore(s => s.openCompletionModal);

    // Optimized selector: only re-render if THIS task becomes active or inactive
    const isActive = useStore(s => s.activeTaskId === task.id);

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const handleMoveToTomorrow = (id: string, _date: string) => {
        // Wrapper to calculate tomorrow date logic if needed, or just pass date string
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        moveTaskToDate(id, tomorrowStr);
    }

    if (task.type === 'reminder') {
        return (
            <ReminderCard
                ref={setNodeRef}
                task={task}
                isOverlay={isOverlay}
                isActive={isActive}
                isDragging={isDragging}
                style={style}
                listeners={listeners}
                attributes={attributes}
                toggleTaskCompletion={toggleTaskCompletion}
                deleteTask={deleteTask}
                setEditingTask={setEditingTask}
            />
        )
    }

    return (
        <TaskCard
            ref={setNodeRef}
            task={task}
            isOverlay={isOverlay}
            isActive={isActive}
            isDragging={isDragging}
            style={style}
            listeners={listeners}
            attributes={attributes}
            toggleTaskCompletion={toggleTaskCompletion}
            deleteTask={deleteTask}
            setActiveTask={setActiveTask}
            moveTaskToDate={handleMoveToTomorrow}
            setEditingTask={setEditingTask}
            openCompletionModal={openCompletionModal}
        />
    );
});

export default TaskBlock;
