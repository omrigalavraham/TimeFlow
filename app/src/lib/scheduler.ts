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

// Helper to convert HH:MM to minutes from midnight
const timeToMinutes = (time: string): number => {
    const [hours, mins] = time.split(':').map(Number);
    return hours * 60 + mins;
};

// Helper minutes to HH:MM
const minutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const assignTimes = (tasks: Task[], startTime: string): Task[] => {
    // 1. Separate fixed (pinned) tasks vs flexible tasks
    const pinnedTasks = tasks.filter(t => t.startTime);
    const flexibleTasks = tasks.filter(t => !t.startTime);

    // Sort pinned by time
    pinnedTasks.sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));

    const scheduledFlexible: Task[] = [];
    let currentTimeMinutes = timeToMinutes(startTime);

    // 2. Iterate and fill gaps
    // This is a simple greedy slot filler.
    // For each flexible task, find the first gap big enough.

    // Simplification: We just try to fit them in order. 
    // We iterate flexibility and jump over pinned tasks.

    let flexIndex = 0;

    while (flexIndex < flexibleTasks.length) {
        const task = flexibleTasks[flexIndex];
        const taskDuration = task.duration + (task.duration > 60 ? 10 : 0); // Buffer

        // Check collision with next pinned task
        const nextPinned = pinnedTasks.find(p => timeToMinutes(p.startTime!) >= currentTimeMinutes);

        if (nextPinned) {
            const timeToPinned = timeToMinutes(nextPinned.startTime!) - currentTimeMinutes;

            if (timeToPinned >= taskDuration) {
                // Fits in gap!
                scheduledFlexible.push({ ...task, startTime: minutesToTime(currentTimeMinutes) });
                currentTimeMinutes += taskDuration;
                flexIndex++;
            } else {
                // Doesn't fit, jump to after this pinned task
                const pinnedEnd = timeToMinutes(nextPinned.startTime!) + nextPinned.duration; // No buffer after pinned? Maybe.
                currentTimeMinutes = Math.max(currentTimeMinutes, pinnedEnd);
            }
        } else {
            // No more pinned tasks ahead, straight shot
            scheduledFlexible.push({ ...task, startTime: minutesToTime(currentTimeMinutes) });
            currentTimeMinutes += taskDuration;
            flexIndex++;
        }

        // Brake fail-safe (e.g. if we go past midnight or stuck)
        if (currentTimeMinutes > 24 * 60) break;
    }

    // Return merged list (preserving original sort? No, new schedule implies new order usually)
    // But we should probably return combined list sorted by time
    const all = [...pinnedTasks, ...scheduledFlexible];
    all.sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));

    return all;
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
