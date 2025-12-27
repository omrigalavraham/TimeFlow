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
    type: 'task' | 'break' | 'reminder' | 'focus' | 'project';
    category?: Category;
    order?: number;
    // Reminder specific fields
    alertTime?: 'at_event' | '5_min_before' | '15_min_before' | '30_min_before' | '1_hour_before' | '1_day_before';
    sound?: 'default' | 'subtle' | 'energetic' | 'none';
    visualRequest?: 'notification' | 'modal' | 'both';
    snoozedUntil?: string; // ISO string
    actionLink?: string;
    autoOpenLink?: boolean;
    groupId?: string; // For grouping related tasks (e.g. Smart Study Plan)
    courseId?: string; // Link to a Course for assignments
    confidenceScore?: number; // 1-5 rating of how well the material was understood
}

export type AssignmentType = 'exercise' | 'project' | 'presentation' | 'exam';

export interface SyllabusItem {
    id: string;
    title: string;
    weight: number; // 0-100
    type: AssignmentType;
    isCompleted?: boolean;
}

export interface Course {
    id: string;
    title: string;
    color?: string;
    syllabus: SyllabusItem[];
}

interface State {
    tasks: Task[];
    courses: Course[]; // New: Manage courses and syllabus
    isLoading: boolean;
    selectedDate: string;
    setSelectedDate: (date: string) => void;

    // Async Actions
    fetchTasks: () => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'completed' | 'scheduledDate'> & { recurrence?: 'daily' | 'weekly', type?: 'task' | 'break' | 'reminder' | 'focus' | 'project', scheduledDate?: string, category?: Category }) => string;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    moveTaskToDate: (id: string, date: string) => void;
    toggleTaskCompletion: (id: string) => void;

    // Sync Actions
    setTasks: (tasks: Task[]) => void;

    // Course Actions
    addCourse: (course: Course) => void;
    updateCourse: (id: string, updates: Partial<Course>) => void;
    deleteCourse: (id: string) => void;

    reorderTasks: (newOrder: Task[]) => void;
    scheduleTasks: (strategy: 'eat-the-frog' | 'snowball' | 'batching') => void;
    handleDelay: (minutes: number) => void;

    // Local UI State
    activeTaskId: string | null;
    setActiveTask: (id: string | null) => void;
    editingTaskId: string | null;
    setEditingTask: (id: string | null) => void;
    deleteTaskGroup: (groupId: string) => void;
    deleteStudyGroupByTitle: (title: string) => void;
    streak: number;
    completionData: { taskId: string; elapsedTime?: number } | null;
    openCompletionModal: (taskId: string, elapsedTime?: number) => void;
    closeCompletionModal: () => void;

    // Gamification
    xp: number;
    level: number;
    addXp: (amount: number) => void;

    // Smart Features
    generateStudyPlan: (plan: {
        title: string;
        deadline: string;
        startDate: string;
        sessionDuration: number;
        selectedDays: number[]; // 0=Sunday
        examAlert: string;
        replaceTitle?: string;
        topics?: string[];
        existingGroupId?: string;
    }) => void;

    generateAssignmentPlan: (plan: {
        title: string;
        courseId: string;
        deadline: string;
        estimatedHours?: number;
        breakdownStrategy: 'auto' | 'manual' | 'one_shot';
        manualSteps?: string[];
    }) => void;

    // Reality Check / Daily Plan
    dayStatus: 'planning' | 'active' | 'completed';
    setDayStatus: (status: 'planning' | 'active' | 'completed') => void;
    workEndTime: string | null; // "17:30"
    setWorkEndTime: (time: string | null) => void;

    // Categories & Filters
    activeCategoryFilter: Category | 'all' | 'reminders' | 'overview';
    setCategoryFilter: (category: Category | 'all' | 'reminders' | 'overview') => void;

    // Missed Session Handling
    handleRescheduleMissed: (taskIds: string[], action: 'spread' | 'move_today' | 'dismiss') => void;

    // Global UI State
    isTaskInputOpen: boolean;
    setIsTaskInputOpen: (isOpen: boolean) => void;
}

export const useStore = create<State>((set, get) => ({
    tasks: [],
    courses: [], // Initial state
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

    // Global UI
    isTaskInputOpen: false,
    setIsTaskInputOpen: (isOpen) => set({ isTaskInputOpen: isOpen }),

    // Default implementation for handleRescheduleMissed if missing (adding mock to fix type error if needed, but likely the interface demands implementation below or in initial object)
    // Wait, the interface has it, we need to implement it in the initial state object or later?
    // The previous code had it? No, the finding view_file showed it ended at line 488 but checking search...
    // Ah, my previous view_file stopped. I need to make sure I add 'handleRescheduleMissed' implementation if it's not there.
    // Based on the error "missing ... handleRescheduleMissed", it seems it wasn't implemented in the initial object.
    // I will add a dummy implementation for now to satisfy the type.
    handleRescheduleMissed: (taskIds, action) => {
        const { tasks, updateTask, deleteTask } = get();
        const today = new Date().toISOString().split('T')[0];

        if (action === 'dismiss') {
            taskIds.forEach(id => deleteTask(id));
            return;
        }

        if (action === 'move_today') {
            taskIds.forEach(id => updateTask(id, { scheduledDate: today }));
            return;
        }

        if (action === 'spread') {
            // Spread over the next 3 days
            taskIds.forEach((id, index) => {
                const date = new Date();
                date.setDate(date.getDate() + (index % 3) + 1); // +1 start from tomorrow
                updateTask(id, { scheduledDate: date.toISOString().split('T')[0] });
            });
        }
    },

    setSelectedDate: (date) => set({ selectedDate: date }),
    setActiveTask: (id) => set({ activeTaskId: id }),
    setEditingTask: (id) => set({ editingTaskId: id }),

    // Course Actions
    addCourse: (course) => set((state) => ({ courses: [...state.courses, course] })),
    updateCourse: (id, updates) => set((state) => ({
        courses: state.courses.map(c => c.id === id ? { ...c, ...updates } : c)
    })),
    deleteCourse: (id) => set((state) => ({
        courses: state.courses.filter(c => c.id !== id)
    })),

    // Group Actions
    deleteTaskGroup: (groupId) => {
        set((state) => {
            const tasksToDelete = state.tasks.filter(t => t.groupId === groupId);
            // Optimistic UI update
            const newTasks = state.tasks.filter(t => t.groupId !== groupId);

            // Background DB delete
            // Note: In a real app we might want a batch delete endpoint
            tasksToDelete.forEach(t => {
                supabase.from('tasks').delete().eq('id', t.id).then(({ error }) => {
                    if (error) console.error('Error deleting task in group:', error);
                });
            });

            return { tasks: newTasks };
        });
    },

    // Legacy Fallback: Delete by Title (for study plans without groupId)
    deleteStudyGroupByTitle: (baseTitle) => {
        set((state) => {
            // Clean the base title from any prefixes
            const cleanTitle = baseTitle
                .replace('🏆 ', '')
                .replace('📚 למידה: ', '')
                .replace('📚 ', '')
                .split(':')[0]  // Get only the course name before the topic
                .trim();

            // Match tasks more flexibly:
            // - Exam tasks: "🏆 courseName"
            // - Study tasks: "📚 courseName: topic" (starts with the pattern)
            const tasksToDelete = state.tasks.filter(t =>
                t.category === 'study' && (
                    t.title === `🏆 ${cleanTitle}` ||
                    t.title.startsWith(`📚 ${cleanTitle}:`) ||
                    t.title.startsWith(`📚 למידה: ${cleanTitle}`)
                )
            );

            const newTasks = state.tasks.filter(t => !tasksToDelete.includes(t));

            // Delete from DB
            tasksToDelete.forEach(t => {
                supabase.from('tasks').delete().eq('id', t.id).then(({ error }) => {
                    if (error) console.error('Error deleting study group task:', error);
                });
            });

            return { tasks: newTasks };
        });
    },

    generateStudyPlan: async ({ title, deadline, startDate, sessionDuration, selectedDays, examAlert, replaceTitle, topics = [], existingGroupId }) => {
        const { addTask, tasks, deleteTask } = get();

        // 0. Clean up logic: "Clean & Rebuild"
        // If we are editing an existing plan (existingGroupId) OR creating a new one that replaces an old title

        let groupId = existingGroupId || generateId();

        if (existingGroupId) {
            // EDIT MODE: Delete ALL FUTURE tasks of this group to prevent duplicates.
            // We keep past tasks (history) or completed tasks? 
            // User request: "If editing, delete old, add new". 
            // Simplest safety: Delete all non-completed tasks from today onwards.
            const today = getToday();

            const tasksToDelete = tasks.filter(t =>
                t.groupId === existingGroupId &&
                !t.completed &&
                (t.scheduledDate >= today || !t.scheduledDate)
            );

            tasksToDelete.forEach(t => deleteTask(t.id));
        }

        // 1. Create the Milestone (The Exam) if it doesn't verify existence
        // If editing, we might already have the exam task? 
        // Let's check if the Exam Task exists.
        let examTask = tasks.find(t => t.groupId === groupId && t.title.includes('🏆'));

        if (!examTask) {
            get().addTask({
                title: `🏆 ${title}`,
                scheduledDate: deadline,
                duration: 0,
                priority: 'must',
                type: 'task',
                category: 'study',
                groupId: groupId,
                alertTime: '1_day_before',
            });
        } else {
            // Update the exam task date/title if changed
            get().updateTask(examTask.id, {
                scheduledDate: deadline,
                title: `🏆 ${title}`
            });
        }

        // 2. Smart Scheduling (Distribute Topics)
        const start = new Date(startDate);
        const end = new Date(deadline);
        // Normalize
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        // Calculate available days
        const availableDates: string[] = [];
        const current = new Date(start);

        // Guard: Don't schedule PAST the deadline
        while (current < end) {
            if (selectedDays.includes(current.getDay())) {
                availableDates.push(current.toISOString().split('T')[0]);
            }
            current.setDate(current.getDate() + 1);
        }

        // Distribute Topics
        // If topics provided, spread them. If not, just generic sessions.
        const topicsToSchedule = topics.length > 0 ? topics : ["חזרה כללית", "תרגול שאלות", "סיכום חומר"];

        // If we have more topics than days, we double up.
        // If we have more days than topics, we add "Review" days.

        let topicIndex = 0;

        if (availableDates.length === 0) {
            // Throw error so UI can handle it and show user feedback
            console.error("No available dates selected for study plan");
            alert("לא נמצאו ימי לימוד זמינים בין תאריך ההתחלה לתאריך המבחן. בדוק שבחרת ימים בשבוע.");
            return;
        }

        availableDates.forEach((dateStr) => {
            // Determine what to study today
            let dailyTopic = "";

            if (topicIndex < topicsToSchedule.length) {
                dailyTopic = topicsToSchedule[topicIndex];
                topicIndex++;

                // If we have LOTS of topics, maybe add another one to this day?
                // Simple heuristic: if remaining topics > remaining days * 1.5
                const remainingDays = availableDates.length - availableDates.indexOf(dateStr);
                const remainingTopics = topicsToSchedule.length - topicIndex;

                if (remainingTopics > remainingDays) {
                    dailyTopic += ` + ${topicsToSchedule[topicIndex]}`;
                    topicIndex++;
                }
            } else {
                dailyTopic = "חזרה ותרגול"; // Filler for extra days
            }

            get().addTask({
                title: `📚 ${title}: ${dailyTopic}`,
                scheduledDate: dateStr,
                duration: sessionDuration,
                priority: 'should',
                type: 'task',
                category: 'study',
                groupId: groupId,
            });
        });
    },

    generateAssignmentPlan: ({ title, courseId, deadline, estimatedHours, breakdownStrategy, manualSteps }) => {
        const { addTask } = get();
        const groupId = generateId();
        const today = getToday();

        // 1. Create the Submission Milestone
        addTask({
            title: `🏁 הגשה: ${title}`,
            scheduledDate: deadline,
            duration: 0,
            priority: 'must',
            type: 'project', // Mark as a Project/Assignment Root
            category: 'study',
            groupId: groupId,
            courseId: courseId || undefined, // Link to course if provided
            alertTime: '1_day_before',
        });

        if (breakdownStrategy === 'one_shot') {
            addTask({
                title: `📝 עבודה על: ${title}`,
                scheduledDate: deadline > today ? today : deadline,
                duration: (estimatedHours || 2) * 60,
                priority: 'should',
                type: 'task',
                category: 'study',
                groupId: groupId,
                courseId: courseId || undefined,
            });
            return;
        }

        // Logic for breakdown (Auto/Manual)
        let tasksToCreate: { title: string, duration: number }[] = [];

        if (breakdownStrategy === 'manual' && manualSteps) {
            tasksToCreate = manualSteps.map(step => ({ title: step, duration: 60 }));
        } else if (breakdownStrategy === 'auto' && estimatedHours) {
            const sessionLength = 90; // 1.5 hours
            const totalMinutes = estimatedHours * 60;
            const sessions = Math.ceil(totalMinutes / sessionLength);

            for (let i = 1; i <= sessions; i++) {
                tasksToCreate.push({
                    title: `חלק ${i}/${sessions}: עבודה על ${title}`,
                    duration: sessionLength
                });
            }
        }

        // Simple Distributor: Spread evenly between today and deadline
        if (tasksToCreate.length > 0) {
            const start = new Date(today);
            const end = new Date(deadline);
            const dayDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

            // Distribute
            tasksToCreate.forEach((task, index) => {
                // simple linear mapping
                const dayOffset = Math.floor((index / tasksToCreate.length) * dayDiff);
                const taskDate = new Date(start);
                taskDate.setDate(start.getDate() + dayOffset);

                addTask({
                    title: task.title,
                    scheduledDate: taskDate.toISOString().split('T')[0],
                    duration: task.duration,
                    priority: 'should',
                    type: 'task',
                    category: 'study',
                    groupId: groupId,
                    courseId: courseId || undefined,
                });
            });
        }
    },
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
            title: t.title || "משימה ללא שם",
            duration: Number(t.duration) || 15, // Ensure Number
            priority: (t.priority as Priority) || 'should',
            deadline: t.deadline,
            startTime: t.start_time,
            scheduledDate: t.scheduled_date || getToday(),
            completed: Boolean(t.completed),
            actualDuration: t.actual_duration ? Number(t.actual_duration) : undefined,
            recurrence: t.recurrence as any,
            type: (t.type as any) || 'task',
            category: (t.category as any) || 'other',
            // Reminder Mappings
            alertTime: t.alert_time,
            sound: t.sound,
            groupId: t.group_id, // Critical Fix
            visualRequest: t.visual_request,
            snoozedUntil: t.snoozed_until,
            actionLink: t.action_link,
            autoOpenLink: t.auto_open_link
        }));

        set({ tasks: mappedTasks, isLoading: false });
    },

    addTask: (task) => {
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
            // Reminder Mappings
            alert_time: task.alertTime,
            sound: task.sound,
            visual_request: task.visualRequest,
            snoozed_until: task.snoozedUntil,
            action_link: task.actionLink,
            auto_open_link: task.autoOpenLink,
            group_id: task.groupId,
            user_id: undefined // resolved in async block
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
            category: task.category || 'other',
            groupId: task.groupId
        };

        set(state => ({ tasks: [...state.tasks, optimisticTask] }));

        if (!supabase || task.type === 'focus') return optimisticId; // Skip DB for Ghost Tasks

        // Async DB Insert
        (async () => {
            const userId = (await supabase.auth.getUser())?.data.user?.id;

            // Update base with user_id
            const baseWithUser = { ...newTaskBase, user_id: userId };

            const entriesToInsert: any[] = [];
            const baseDate = new Date(scheduledDate);
            entriesToInsert.push(baseWithUser);

            // 2. Recurrence
            if (task.recurrence === 'daily') {
                for (let i = 1; i <= 6; i++) {
                    const nextDate = new Date(baseDate);
                    nextDate.setDate(baseDate.getDate() + i);
                    entriesToInsert.push({
                        ...baseWithUser,
                        scheduled_date: nextDate.toISOString().split('T')[0]
                    });
                }
            } else if (task.recurrence === 'weekly') {
                for (let i = 1; i <= 3; i++) {
                    const nextDate = new Date(baseDate);
                    nextDate.setDate(baseDate.getDate() + (i * 7));
                    entriesToInsert.push({
                        ...baseWithUser,
                        scheduled_date: nextDate.toISOString().split('T')[0]
                    });
                }
            }

            const { data, error } = await supabase.from('tasks').insert(entriesToInsert).select();

            if (error) {
                console.error('Error adding task FULL:', JSON.stringify(error, null, 2));
                console.error('Error details:', error.message, error.details, error.hint);
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
                    category: t.category,
                    groupId: t.group_id,
                    alertTime: t.alert_time,
                    sound: t.sound,
                    visualRequest: t.visual_request,
                    snoozedUntil: t.snoozed_until,
                    actionLink: t.action_link,
                    autoOpenLink: t.auto_open_link
                }));

                set(state => ({
                    tasks: [...state.tasks.filter(t => t.id !== optimisticId), ...realTasks]
                }));
            }
        })();

        return optimisticId;

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

        // Reminder Update Mappings
        if (updates.alertTime !== undefined) dbUpdates.alert_time = updates.alertTime;
        if (updates.sound !== undefined) dbUpdates.sound = updates.sound;
        if (updates.visualRequest !== undefined) dbUpdates.visual_request = updates.visualRequest;
        if (updates.snoozedUntil !== undefined) dbUpdates.snoozed_until = updates.snoozedUntil;
        if (updates.actionLink !== undefined) dbUpdates.action_link = updates.actionLink;
        if (updates.autoOpenLink !== undefined) dbUpdates.auto_open_link = updates.autoOpenLink;

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
        const { error } = await supabase.from('tasks').update({ scheduled_date: date, start_time: null }).eq('id', id);
        if (error) console.error('Error moving task to date:', error);
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
