"use client";

import { useStore, Task } from '@/lib/store';
import { TaskCard } from './TaskCard';

export const TaskCardOverlay = ({ task }: { task: Task }) => {
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
