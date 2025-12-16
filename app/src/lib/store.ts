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
    actualDuration?: number; // in minutes
    recurrence?: 'daily' | 'weekly';
    type: 'task' | 'break';
}

interface State {
    tasks: Task[];
    isLoading: boolean; // Add loading state
    selectedDate: string;
    setSelectedDate: (date: string) => void;

    // Async Actions
    fetchTasks: () => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'completed' | 'scheduledDate'> & { recurrence?: 'daily' | 'weekly', type?: 'task' | 'break', scheduledDate?: string }) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    moveTaskToDate: (id: string, date: string) => void;
    toggleTaskCompletion: (id: string) => void;

    // Sync Actions (UI only, or batch update later?)
    setTasks: (tasks: Task[]) => void;
    reorderTasks: (newOrder: Task[]) => void;
    scheduleTasks: (strategy: 'eat-the-frog' | 'snowball' | 'batching') => void;
    handleDelay: (minutes: number) => void;

    // Local UI State
    activeTaskId: string | null;
    setActiveTask: (id: string | null) => void;
    editingTaskId: string | null; // New
    setEditingTask: (id: string | null) => void; // New
    streak: number;
    completionData: { taskId: string; elapsedTime?: number } | null;
    openCompletionModal: (taskId: string, elapsedTime?: number) => void;
    closeCompletionModal: () => void;

    // Gamification
    xp: number;
    level: number;
    addXp: (amount: number) => void;

    // Reality Check / Daily Plan
    dayStatus: 'planning' | 'active' | 'completed';
    setDayStatus: (status: 'planning' | 'active' | 'completed') => void;
    workEndTime: string | null; // "17:30"
    setWorkEndTime: (time: string | null) => void;
}

export const useStore = create<State>((set, get) => ({
    tasks: [],
    isLoading: false,
    streak: 0,
    completionData: null,
    activeTaskId: null,
    editingTaskId: null,
    selectedDate: getToday(),

    // New Defaults
    dayStatus: 'planning', // Starts in planning mode every open? Or persists? Let's default to planning implies "Needs plan".
    workEndTime: null,

    setDayStatus: (status) => set({ dayStatus: status }),
    setWorkEndTime: (time) => set({ workEndTime: time }),

    setSelectedDate: (date) => set({ selectedDate: date }),
    setActiveTask: (id) => set({ activeTaskId: id }),
    setEditingTask: (id) => set({ editingTaskId: id }), // New action
    openCompletionModal: (taskId, elapsedTime) => set({ completionData: { taskId, elapsedTime } }),
    closeCompletionModal: () => set({ completionData: null }),
    setTasks: (tasks) => set({ tasks }),

    fetchTasks: async () => {
        if (!supabase) return;
        set({ isLoading: true });
        const { data, error } = await supabase.from('tasks').select('*');

        if (error) {
            console.error('Error fetching tasks:', error);
            set({ isLoading: false });
            return;
        }

        const mappedTasks: Task[] = (data || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            duration: t.duration,
            priority: t.priority as Priority,
            deadline: t.deadline,
            startTime: t.start_time,
            scheduledDate: t.scheduled_date,
            completed: t.completed,
            actualDuration: t.actual_duration,
            recurrence: t.recurrence as any,
            type: t.type as any
        }));

        set({ tasks: mappedTasks, isLoading: false });
    },

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
            scheduled_date: scheduledDate,
            completed: false,
            user_id: (await supabase?.auth.getUser())?.data.user?.id
        };

        // Optimistic Update
        const optimisticId = generateId();
        const optimisticTask: Task = {
            ...task,
            id: optimisticId,
            startTime: task.startTime, // Pass start time
            scheduledDate: scheduledDate,
            completed: false,
            type: task.type || 'task'
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
