import { Task } from './store';

export interface DayAnalysis {
    totalMinutesNeeded: number;
    availableMinutes: number;
    overflowMinutes: number;
    tasksCount: number;
    status: 'comfortable' | 'tight' | 'impossible';
}

export interface OptimizedPlan {
    acceptedTasks: Task[];
    deferredTasks: Task[]; // Tasks suggested to be moved to tomorrow
    reason: string; // Explanation for the user
}

// Helper to get minutes difference between now and end time
export const getMinutesUntil = (endTimeStr: string): number => {
    const now = new Date();
    const end = new Date();
    const [hours, minutes] = endTimeStr.split(':').map(Number);

    end.setHours(hours, minutes, 0, 0);

    // If end time is before now (e.g. 2AM tomorrow, or user selected past time), handle logic
    // For simplicity, if end time is earlier than now, assume it's tomorrow? 
    // Or just return 0 if it's already past. 
    // Let's assume strict daily planning: if it's past, it's 0.
    if (end.getTime() < now.getTime()) {
        return 0;
    }

    const diffMs = end.getTime() - now.getTime();
    return Math.floor(diffMs / 1000 / 60);
};

export const calculateWorkload = (tasks: Task[], availableMinutes: number): DayAnalysis => {
    const totalMinutesNeeded = tasks.reduce((acc, t) => acc + t.duration, 0);
    const overflow = Math.max(0, totalMinutesNeeded - availableMinutes);

    let status: DayAnalysis['status'] = 'comfortable';

    // Logic for status
    if (overflow > 0) {
        status = 'impossible';
    } else if (availableMinutes - totalMinutesNeeded < 60) {
        // Less than an hour buffer
        status = 'tight';
    }

    return {
        totalMinutesNeeded,
        availableMinutes,
        overflowMinutes: overflow,
        tasksCount: tasks.length,
        status
    };
};

export const optimizeDay = (tasks: Task[], availableMinutes: number): OptimizedPlan => {
    // Sort logic: 
    // 1. Must (Urgent)
    // 2. Should (Important)
    // 3. Could (Nice to have)
    // Within priority, maybe shortest first to knock things out? Or keep original order?
    // Let's preserve original order within priority buckets to respect user's rough sorting if any.

    const must = tasks.filter(t => t.priority === 'must');
    const should = tasks.filter(t => t.priority === 'should');
    const could = tasks.filter(t => t.priority === 'could');

    const accepted: Task[] = [];
    const deferred: Task[] = [];
    let usedTime = 0;

    // 1. Fit Musts
    // Check if even Musts fit?
    const mustDuration = must.reduce((sum, t) => sum + t.duration, 0);

    if (mustDuration > availableMinutes) {
        // Even urgent tasks don't fit
        // We take what fits from Musts
        for (const task of must) {
            if (usedTime + task.duration <= availableMinutes) {
                accepted.push(task);
                usedTime += task.duration;
            } else {
                deferred.push(task);
            }
        }
        // defer all rest
        deferred.push(...should, ...could);

        return {
            acceptedTasks: accepted,
            deferredTasks: deferred,
            reason: `עומס קריטי! אפילו משימות החובה חורגות ב-${mustDuration - availableMinutes} דקות. הכנסנו רק את הדחוף ביותר.`
        };
    }

    // Musts fit
    accepted.push(...must);
    usedTime += mustDuration;

    // 2. Fit Shoulds
    for (const task of should) {
        if (usedTime + task.duration <= availableMinutes) {
            accepted.push(task);
            usedTime += task.duration;
        } else {
            deferred.push(task);
        }
    }

    // 3. Fit Coulds
    for (const task of could) {
        if (usedTime + task.duration <= availableMinutes) {
            accepted.push(task);
            usedTime += task.duration;
        } else {
            deferred.push(task);
        }
    }

    if (deferred.length === 0) {
        return {
            acceptedTasks: accepted,
            deferredTasks: [],
            reason: "הכל נכנס! יש לך יום מאוזן. 🎉"
        };
    }

    return {
        acceptedTasks: accepted,
        deferredTasks: deferred,
        reason: `הלו"ז צפוף. העברנו ${deferred.length} משימות בעדיפות נמוכה למחר כדי שתוכל לסיים בזמן.`
    }
};
