import { create } from 'zustand';
import { supabase } from './supabase';
import { generateId } from './utils';
import { scheduleTasks as generateSchedule, shiftSchedule, assignTimes } from './scheduler';

export type Priority = 'must' | 'should' | 'could';
export type Category = 'work' | 'study' | 'home' | 'health' | 'social' | 'other';

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
    category?: Category;
    order?: number;
}

interface State {
    tasks: Task[];
    isLoading: boolean;
    selectedDate: string;
    setSelectedDate: (date: string) => void;

    // Async Actions
    fetchTasks: () => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'completed' | 'scheduledDate'> & { recurrence?: 'daily' | 'weekly', type?: 'task' | 'break', scheduledDate?: string, category?: Category }) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    moveTaskToDate: (id: string, date: string) => void;
    toggleTaskCompletion: (id: string) => void;

    // Sync Actions
    setTasks: (tasks: Task[]) => void;
    reorderTasks: (newOrder: Task[]) => void;
    scheduleTasks: (strategy: 'eat-the-frog' | 'snowball' | 'batching') => void;
    handleDelay: (minutes: number) => void;

    // Local UI State
    activeTaskId: string | null;
    setActiveTask: (id: string | null) => void;
    editingTaskId: string | null;
    setEditingTask: (id: string | null) => void;
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

    // Categories & Filters
    activeCategoryFilter: Category | 'all';
    setCategoryFilter: (category: Category | 'all') => void;
}

export const useStore = create<State>((set, get) => ({
    tasks: [],
    isLoading: false,
    streak: 0,
    completionData: null,
    activeTaskId: null,
    editingTaskId: null,
    selectedDate: getToday(),

    // Defaults
    dayStatus: 'planning',
    workEndTime: null,
    activeCategoryFilter: 'all',

    setDayStatus: (status) => set({ dayStatus: status }),
    setWorkEndTime: (time) => set({ workEndTime: time }),
    setCategoryFilter: (category) => set({ activeCategoryFilter: category }),

    setSelectedDate: (date) => set({ selectedDate: date }),
    setActiveTask: (id) => set({ activeTaskId: id }),
    setEditingTask: (id) => set({ editingTaskId: id }),
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
            type: t.type as any,
            category: t.category as any
        }));

        set({ tasks: mappedTasks, isLoading: false });
    },

    addTask: async (task) => {
        const state = get();
        const scheduledDate = task.scheduledDate || state.selectedDate;
        const newTaskBase = {
            title: task.title,
            duration: task.duration,
            priority: task.priority,
            deadline: task.deadline,
            start_time: task.startTime,
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
            startTime: task.startTime || null,
            scheduledDate: scheduledDate,
            completed: false,
            type: task.type || 'task',
            category: task.category || 'other'
        };

        set(state => ({ tasks: [...state.tasks, optimisticTask] }));

        if (!supabase) return;

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
            set(state => ({ tasks: state.tasks.filter(t => t.id !== optimisticId) }));
        } else if (data) {
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
                type: t.type,
                category: t.category
            }));

            set(state => ({
                tasks: [...state.tasks.filter(t => t.id !== optimisticId), ...realTasks]
            }));
        }
    },

    updateTask: async (id, updates) => {
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));

        if (!supabase) return;

        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
        if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
        if (updates.actualDuration !== undefined) dbUpdates.actual_duration = updates.actualDuration;
        if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
        if (updates.category !== undefined) dbUpdates.category = updates.category;

        await supabase.from('tasks').update(dbUpdates).eq('id', id);
    },

    deleteTask: async (id) => {
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));

        if (!supabase) return;
        await supabase.from('tasks').delete().eq('id', id);
    },

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

    xp: 0,
    level: 1,
    addXp: (amount) => {
        set(state => {
            const newXp = state.xp + amount;
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
            if (newLevel > state.level) {
                console.log("Level Up!", newLevel);
            }
            return { xp: newXp, level: newLevel };
        });
    }
}));
