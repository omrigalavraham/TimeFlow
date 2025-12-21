"use client";

import { useEffect, useState, useRef } from 'react';
import { useStore, Task } from '@/lib/store';
import ReminderModal from './ReminderModal';

export default function ReminderManager() {
    const tasks = useStore((state) => state.tasks);
    const updateTask = useStore((state) => state.updateTask);
    const toggleTaskCompletion = useStore((state) => state.toggleTaskCompletion);

    // State to manage the currently displayed reminder
    const [activeReminder, setActiveReminder] = useState<Task | null>(null);

    // Ref to track triggered alerts to prevent duplicates during the same minute
    const triggeredAlerts = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Request Notification Permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        // Check Every 30 seconds
        const interval = setInterval(() => {
            checkReminders();
        }, 30000);

        return () => clearInterval(interval);
    }, [tasks]);

    const checkReminders = () => {
        const now = new Date();
        const currentTimeStr = now.toTimeString().slice(0, 5); // "14:30"

        tasks.filter(t => t.type === 'reminder' && !t.completed).forEach(task => {
            // Logic to determine if we should alert
            // 1. Check Snooze
            if (task.snoozedUntil) {
                const snoozeTime = new Date(task.snoozedUntil);
                if (now >= snoozeTime && !triggeredAlerts.current.has(task.id + '_snooze_' + snoozeTime.toISOString())) {
                    triggerAlert(task, '_snooze_' + snoozeTime.toISOString());
                }
                return;
            }

            // 2. Check Event Time
            if (task.startTime && task.scheduledDate === now.toISOString().split('T')[0]) {
                const [h, m] = task.startTime.split(':').map(Number);
                const eventDate = new Date();
                eventDate.setHours(h, m, 0, 0);

                let triggerDate = new Date(eventDate);

                // Adjust based on alertTime setting
                if (task.alertTime) {
                    switch (task.alertTime) {
                        case '5_min_before': triggerDate.setMinutes(eventDate.getMinutes() - 5); break;
                        case '15_min_before': triggerDate.setMinutes(eventDate.getMinutes() - 15); break;
                        case '30_min_before': triggerDate.setMinutes(eventDate.getMinutes() - 30); break;
                        case '1_hour_before': triggerDate.setHours(eventDate.getHours() - 1); break;
                        case '1_day_before': triggerDate.setDate(eventDate.getDate() - 1); break;
                        case 'at_event': default: break;
                    }
                }

                // Check if NOW is close to Trigger Date (within last minute)
                const diffMs = now.getTime() - triggerDate.getTime();
                // Allow a window of 1 minute (60000ms)
                if (diffMs >= 0 && diffMs < 60000) {
                    if (!triggeredAlerts.current.has(task.id + '_regular')) {
                        triggerAlert(task, '_regular');
                    }
                }
            }
        });
    };

    const triggerAlert = (task: Task, triggerIdSuffix: string) => {
        setActiveReminder(task);
        triggeredAlerts.current.add(task.id + triggerIdSuffix);

        // Browser Notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(task.title, {
                body: 'תזכורת מ-TimeFlow',
                icon: '/favicon.ico' // Assuming favicon exists
            });
        }

        // Auto Open Link logic
        if (task.autoOpenLink && task.actionLink) {
            window.open(task.actionLink, '_blank');
        }

        // Audio is handled in ReminderModal mount
    };

    const handleSnooze = (minutes: number) => {
        if (!activeReminder) return;

        const snoozeDate = new Date();
        snoozeDate.setMinutes(snoozeDate.getMinutes() + minutes);

        updateTask(activeReminder.id, {
            snoozedUntil: snoozeDate.toISOString()
        });

        setActiveReminder(null);
    };

    const handleComplete = () => {
        if (!activeReminder) return;
        toggleTaskCompletion(activeReminder.id);
        setActiveReminder(null);
    };

    const handleClose = () => {
        setActiveReminder(null);
    };

    if (!activeReminder) return null;

    return (
        <ReminderModal
            task={activeReminder}
            onClose={handleClose}
            onSnooze={handleSnooze}
            onComplete={handleComplete}
        />
    );
}
