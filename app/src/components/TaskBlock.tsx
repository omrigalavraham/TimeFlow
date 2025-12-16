"use client";

import { Task, useStore } from '@/lib/store';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskCard } from './TaskCard';

interface Props {
    task: Task;
    isOverlay?: boolean;
}

export default function TaskBlock({ task, isOverlay }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: task });

    // Store Actions
    const {
        toggleTaskCompletion,
        deleteTask,
        activeTaskId,
        setActiveTask,
        moveTaskToDate,
        setEditingTask,
        openCompletionModal
    } = useStore();

    const isActive = activeTaskId === task.id;

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
}
