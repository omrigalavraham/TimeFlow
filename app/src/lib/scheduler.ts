import { Task } from './store';

// Helper to add minutes to a time string (HH:MM)
const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

// Start scheduling from the next round 15 minutes or 9:00 if it's too early/late?
// For MVP, letting start from "Now" rounded up.
const getStartTime = (): string => {
    const now = new Date();
    const remainder = 15 - (now.getMinutes() % 15);
    now.setMinutes(now.getMinutes() + remainder);
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

type Strategy = 'eat-the-frog' | 'snowball' | 'batching';

export const scheduleTasks = (tasks: Task[], strategy: Strategy = 'eat-the-frog'): Task[] => {
    let sortedTasks = [...tasks];

    // 1. Sort based on Strategy
    switch (strategy) {
        case 'eat-the-frog':
            // Priority: Must > Should > Could. Within priority: Longest > Shortest
            sortedTasks.sort((a, b) => {
                const priorityScore: Record<string, number> = { must: 3, should: 2, could: 1 };
                const diff = priorityScore[b.priority] - priorityScore[a.priority];
                if (diff !== 0) return diff;
                return b.duration - a.duration; // Longest first
            });
            break;

        case 'snowball':
            // Shortest first, then by priority
            sortedTasks.sort((a, b) => {
                const diff = a.duration - b.duration; // Shortest first
                if (diff !== 0) return diff;
                const priorityScore: Record<string, number> = { must: 3, should: 2, could: 1 };
                return priorityScore[b.priority] - priorityScore[a.priority];
            });
            break;

        case 'batching':
            // Logic: Group short tasks (<15) together. 
            // Complex to implement strictly with sort, but we can prioritize shorties in groups.
            // For MVP: Sort by priority, but within priority, group short tasks?
            // Let's simplified Batching: Must (Short -> Long) -> Should (Short -> Long)
            sortedTasks.sort((a, b) => {
                const priorityScore: Record<string, number> = { must: 3, should: 2, could: 1 };
                const diff = priorityScore[b.priority] - priorityScore[a.priority];
                if (diff !== 0) return diff;
                return a.duration - b.duration; // Shortest first within priority
            });
            break;
    }

    // 2. Assign Times
    const startTime = getStartTime();
    return assignTimes(sortedTasks, startTime);
};

export const assignTimes = (tasks: Task[], startTime: string): Task[] => {
    let currentTime = startTime;

    return tasks.map((task) => {
        const itemStartTime = currentTime;
        let duration = task.duration;

        // Add buffer if task is long (> 60 min)
        let buffer = 0;
        if (duration > 60) {
            buffer = 10;
        }

        currentTime = addMinutes(currentTime, duration + buffer);

        return {
            ...task,
            startTime: itemStartTime,
        };
    });
};

export const shiftSchedule = (tasks: Task[], delayMinutes: number): Task[] => {
    if (tasks.length === 0) return tasks;

    // Only shift tasks that have a start time (are scheduled) and are NOT completed.
    // In a real app, we'd check if startTime > now, but for MVP we shift all incomplete scheduled tasks.

    return tasks.map(task => {
        if (task.completed || !task.startTime) return task;

        return {
            ...task,
            startTime: addMinutes(task.startTime, delayMinutes),
        };
    });

    // TODO: Implement "Drop Could" logic if end time > 18:00
};
