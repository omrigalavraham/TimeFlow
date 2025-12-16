import { create } from 'zustand';
import { supabase } from './supabase';
import { generateId } from './utils';
import { scheduleTasks as generateSchedule, shiftSchedule, assignTimes } from './scheduler';

export type Priority = 'must' | 'should' | 'could';

const getToday = () => new Date().toISOString().split('T')[0];

export interface Task {
    id: string;
    title: string;
    duration: number; // in minutes
    priority: Priority;
    deadline?: string;
    startTime?: string | null; // ISO string if scheduled
    scheduledDate: string; // YYYY-MM-DD
    completed: boolean;
    priority: Priority;
    recurrence?: 'daily' | 'weekly';
    category?: Category; // New
    startTime?: string | null; // ISO string if scheduled
    actualDuration?: number; // in minutes
    scheduledDate: string; // YYYY-MM-DD
    order?: number; // Custom sort order
    type: 'task' | 'break';
}

interface State {
    tasks: Task[];
    isLoading: boolean; // Add loading state
    selectedDate: string;
    setSelectedDate: (date: string) => void;

    // Async Actions
    fetchTasks: () => Promise<void>;
    // Async Actions
    fetchTasks: () => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'completed' | 'scheduledDate'> & { recurrence?: 'daily' | 'weekly', type?: 'task' | 'break', scheduledDate?: string, category?: Category }) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    // ... (skipping lines)
    addTask: async (task) => {
        const state = get();
const scheduledDate = task.scheduledDate || state.selectedDate; // Use provided date or fallback to selected
const newTaskBase = {
    title: task.title,
    duration: task.duration,
    priority: task.priority,
    deadline: task.deadline,
    start_time: task.startTime, // Pass start time if provided
    recurrence: task.recurrence,
    type: task.type || 'task',
    category: task.category || 'other',
    scheduled_date: scheduledDate,
    completed: false,
    user_id: (await supabase?.auth.getUser())?.data.user?.id
};

// Optimistic Update
const optimisticId = generateId();
const optimisticTask: Task = {
    ...task,
    id: optimisticId,
    startTime: task.startTime || null, // Pass start time
    scheduledDate: scheduledDate,
    completed: false,
    type: task.type || 'task',
    category: task.category || 'other'
};

set(state => ({ tasks: [...state.tasks, optimisticTask] }));

if (!supabase) return;

// DB Insert
// Recurrence logic needs to handle multiple inserts... simplified for single insert first, 
// IF recurrence is daily, we generate multiple rows? Or one row with recurrence logic?
// The original store generated simple tasks. I will replicate that behavior.

// Handling recurrence locally first... this is tricky with async db.
// I will do simple single insert for now to match current simple flow, 
// but loop for recurrence if needed.

const entriesToInsert = [];
const baseDate = new Date(scheduledDate);

// 1. Primary
entriesToInsert.push({ ...newTaskBase });

// 2. Recurrence
if (task.recurrence === 'daily') {
    for (let i = 1; i <= 6; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + i);
        entriesToInsert.push({
            ...newTaskBase,
            scheduled_date: nextDate.toISOString().split('T')[0]
        });
    }
} else if (task.recurrence === 'weekly') {
    for (let i = 1; i <= 3; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (i * 7));
        entriesToInsert.push({
            ...newTaskBase,
            scheduled_date: nextDate.toISOString().split('T')[0]
        });
    }
}

const { data, error } = await supabase.from('tasks').insert(entriesToInsert).select();

if (error) {
    console.error('Error adding task:', error);
    // Rollback optimistic update?
    set(state => ({ tasks: state.tasks.filter(t => t.id !== optimisticId) }));
} else if (data) {
    // Replace optimistic with real data
    // Actually, since we might have added multiple, we should just re-fetch or merge.
    // Simplest is to append the real ones and remove optimistic.
    const realTasks = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        duration: t.duration,
        priority: t.priority,
        deadline: t.deadline,
        startTime: t.start_time,
        scheduledDate: t.scheduled_date,
        completed: t.completed,
        actualDuration: t.actual_duration,
        recurrence: t.recurrence,
        type: t.type
    }));

    set(state => ({
        tasks: [...state.tasks.filter(t => t.id !== optimisticId), ...realTasks]
    }));
}
    },

updateTask: async (id, updates) => {
    // Optimistic
    set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));

    if (!supabase) return;

    // Map updates to snake_case
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.actualDuration !== undefined) dbUpdates.actual_duration = updates.actualDuration;
    if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;

    await supabase.from('tasks').update(dbUpdates).eq('id', id);
},

    deleteTask: async (id) => {
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));

        if (!supabase) return;
        await supabase.from('tasks').delete().eq('id', id);
    },

        // ... (rest of the actions updated similarly)
        moveTaskToDate: async (id, date) => {
            set(state => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, scheduledDate: date, startTime: null } : t)
            }));
            if (!supabase) return;
            await supabase.from('tasks').update({ scheduled_date: date, start_time: null }).eq('id', id);
        },

            toggleTaskCompletion: async (id) => {
                const task = get().tasks.find(t => t.id === id);
                if (!task) return;
                const newCompleted = !task.completed;

                // Logic split: Breaks don't count for Streak/XP
                if (task.type === 'break') {
                    set(state => ({
                        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t)
                    }));
                } else {
                    set(state => ({
                        tasks: state.tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t),
                        streak: newCompleted ? state.streak + 1 : Math.max(0, state.streak - 1),
                        xp: newCompleted ? state.xp + 50 : state.xp
                    }));
                }

                if (!supabase) return;
                await supabase.from('tasks').update({ completed: newCompleted }).eq('id', id);
            },

                reorderTasks: (newOrder) => {
                    // Local only for now
                    set((state) => {
                        const otherTasks = state.tasks.filter(t => !newOrder.find(nt => nt.id === t.id));
                        const isScheduled = newOrder.some(t => t.startTime);
                        let assignedTasks = newOrder;

                        if (isScheduled) {
                            const currentFirstTime = state.tasks.find(t => t.startTime && t.scheduledDate === state.selectedDate)?.startTime;
                            if (currentFirstTime) {
                                assignedTasks = assignTimes(newOrder, currentFirstTime);
                            }
                        }
                        return { tasks: [...otherTasks, ...assignedTasks] };
                    });
                },

                    scheduleTasks: (strategy) => {
                        set((state) => {
                            const daysTasks = state.tasks.filter(t => t.scheduledDate === state.selectedDate && !t.completed);
                            const otherTasks = state.tasks.filter(t => t.scheduledDate !== state.selectedDate || t.completed);
                            const scheduled = generateSchedule(daysTasks, strategy);

                            // TODO: Sync changes to DB (updates start_time and order) when we have bandwidth
                            // For now it is local optimistically.

                            return { tasks: [...otherTasks, ...scheduled] };
                        });
                    },

                        handleDelay: (minutes) => {
                            set((state) => {
                                const currentDayTasks = state.tasks.filter(t => t.scheduledDate === state.selectedDate);
                                const otherTasks = state.tasks.filter(t => t.scheduledDate !== state.selectedDate);
                                return {
                                    tasks: [...otherTasks, ...shiftSchedule(currentDayTasks, minutes)],
                                }
                            });
                        },

                            // --- Gamification ---
                            xp: 0,
                                level: 1,
                                    addXp: (amount) => {
                                        set(state => {
                                            const newXp = state.xp + amount;
                                            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1; // Simple progression curve: 0->1, 100->2, 400->3...

                                            if (newLevel > state.level) {
                                                // Level Up!
                                                // We could trigger a celebratory modal here if we had one
                                                console.log("Level Up!", newLevel);
                                            }

                                            return { xp: newXp, level: newLevel };
                                        });
                                    }
}));
