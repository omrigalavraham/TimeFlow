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

const PRIORITY_SCORE: Record<string, number> = { must: 3, should: 2, could: 1 };

export const scheduleTasks = (tasks: Task[], strategy: Strategy = 'eat-the-frog'): Task[] => {
    let sortedTasks = [...tasks];

    // 1. Sort based on Strategy
    switch (strategy) {
        case 'eat-the-frog':
            // Priority: Must > Should > Could. Within priority: Longest > Shortest
            sortedTasks.sort((a, b) => {
                const diff = PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
                if (diff !== 0) return diff;
                return b.duration - a.duration; // Longest first
            });
            break;

        case 'snowball':
            // Shortest first, then by priority
            sortedTasks.sort((a, b) => {
                const diff = a.duration - b.duration; // Shortest first
                if (diff !== 0) return diff;
                return PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
            });
            break;

        case 'batching':
            // Logic: Group short tasks (<15) together. 
            // Complex to implement strictly with sort, but we can prioritize shorties in groups.
            // For MVP: Sort by priority, but within priority, group short tasks?
            // Let's simplified Batching: Must (Short -> Long) -> Should (Short -> Long)
            sortedTasks.sort((a, b) => {
                const diff = PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority];
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
    // Only schedule flexible tasks that are NOT already breaks (we generate breaks dynamically)
    // Actually, if a user manually added a break, we should respect it. 
    // But for auto-breaks, we generate them.
    const flexibleTasks = tasks.filter(t => !t.startTime);

    // Sort pinned by time
    pinnedTasks.sort((a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!));

    const scheduledFlexible: Task[] = [];
    let currentTimeMinutes = timeToMinutes(startTime);
    let consecutiveWorkMinutes = 0;

    // 2. Iterate and fill gaps
    let flexIndex = 0;
    let pinnedIndex = 0; // Optimization: index pointer instead of .find()

    while (flexIndex < flexibleTasks.length) {
        // Find next relevant pinned task (closest one ahead of current time)
        // Since pinnedTasks is sorted, we can just check pinnedIndex
        let nextPinned = null;
        while (pinnedIndex < pinnedTasks.length) {
            if (timeToMinutes(pinnedTasks[pinnedIndex].startTime!) >= currentTimeMinutes) {
                nextPinned = pinnedTasks[pinnedIndex];
                break;
            }
            pinnedIndex++;
        }

        // Smart Break Check
        if (consecutiveWorkMinutes >= 90) {
            // Find gap for break
            const breakDuration = 15;
            let breakScheduled = false;

            // Check collision with next pinned task for Break
            if (nextPinned) {
                const timeToPinned = timeToMinutes(nextPinned.startTime!) - currentTimeMinutes;
                if (timeToPinned >= breakDuration) {
                    // Fits!
                    scheduledFlexible.push({
                        id: `break-${crypto.randomUUID()}`,
                        title: 'הפסקת התרעננות ☕',
                        duration: breakDuration,
                        priority: 'must', // High priority to ensure it stays?
                        type: 'break',
                        scheduledDate: tasks[0]?.scheduledDate, // Use same date
                        completed: false,
                        startTime: minutesToTime(currentTimeMinutes)
                    } as Task);
                    currentTimeMinutes += breakDuration;
                    consecutiveWorkMinutes = 0; // Reset counter
                    breakScheduled = true;
                }
            } else {
                // No pinned ahead
                scheduledFlexible.push({
                    id: `break-${crypto.randomUUID()}`,
                    title: 'הפסקת התרעננות ☕',
                    duration: breakDuration,
                    priority: 'must',
                    type: 'break',
                    scheduledDate: tasks[0]?.scheduledDate,
                    completed: false,
                    startTime: minutesToTime(currentTimeMinutes)
                } as Task);
                currentTimeMinutes += breakDuration;
                consecutiveWorkMinutes = 0;
                breakScheduled = true;
            }
        }

        const task = flexibleTasks[flexIndex];
        const taskDuration = task.duration + (task.duration > 60 ? 10 : 0); // Buffer

        if (nextPinned) {
            const timeToPinned = timeToMinutes(nextPinned.startTime!) - currentTimeMinutes;

            if (timeToPinned >= taskDuration) {
                // Fits in gap!
                scheduledFlexible.push({ ...task, startTime: minutesToTime(currentTimeMinutes) });
                currentTimeMinutes += taskDuration;
                consecutiveWorkMinutes += task.duration; // Add actual work minutes
                flexIndex++;
            } else {
                // Doesn't fit, jump to after this pinned task
                const pinnedEnd = timeToMinutes(nextPinned.startTime!) + nextPinned.duration;
                currentTimeMinutes = Math.max(currentTimeMinutes, pinnedEnd);
                // Reset consecutive minutes if we jumped over a pinned task
                consecutiveWorkMinutes = 0;
                // Don't increment flexIndex, try to fit same task in next slot
            }
        } else {
            // No more pinned tasks ahead, straight shot
            scheduledFlexible.push({ ...task, startTime: minutesToTime(currentTimeMinutes) });
            currentTimeMinutes += taskDuration;
            consecutiveWorkMinutes += task.duration;
            flexIndex++;
        }

        // Brake fail-safe (e.g. if we go past midnight or stuck)
        if (currentTimeMinutes > 24 * 60) break;
    }

    // Return merged list
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

    // "Drop Could" Logic (Soft deadline at 18:00 = 1080 minutes)
    // We iterate from the end. If the last task ends after 18:00 AND is 'could', we unschedule it.
    // In a real usage, we should probably pass the 'workEndTime' variable, but default to 18:00 for MVP.
    const DEADLINE_MINUTES = 18 * 60; // 18:00

    // Working with a reversed copy to pop from end? 
    // Actually, shiftSchedule returns a new array. We can just filter.
    // Wait, shifting shifts everything. The "Drop Could" was a separate idea for *scheduling*.
    // But since this function is 'shiftSchedule' (delaying), it pushes things later.
    // So if pushing makes a 'could' task go late, we drop it (unschedule it).

    return tasks.map(task => {
        if (task.completed || !task.startTime) return task;

        const newStartStr = addMinutes(task.startTime, delayMinutes);
        const newStartMins = timeToMinutes(newStartStr);
        const newEndMins = newStartMins + task.duration;

        if (newStartMins >= 24 * 60) {
            // Pushed to tomorrow? Unschedule for today
            return { ...task, startTime: undefined };
        }

        if (newEndMins > DEADLINE_MINUTES && task.priority === 'could') {
            // Drop 'could' task if it goes overtime due to delay
            return { ...task, startTime: undefined };
        }

        return {
            ...task,
            startTime: newStartStr,
        };
    });
};
