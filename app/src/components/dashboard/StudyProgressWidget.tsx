"use client";

import { useStore } from '@/lib/store';
import { useMemo } from 'react';
import { GraduationCap, Plus, Settings, Trash2, Edit2 } from 'lucide-react';

interface StudyProgressWidgetProps {
    onAdd?: () => void;
    onManage?: (groupId: string) => void;
}

export function StudyProgressWidget({ onAdd, onManage }: StudyProgressWidgetProps) {
    const deleteTaskGroup = useStore(s => s.deleteTaskGroup);
    const deleteStudyGroupByTitle = useStore(s => s.deleteStudyGroupByTitle);

    const tasks = useStore(s => s.tasks);

    // Group study tasks by "Group ID" or Title heuristic
    const studyGroups = useMemo(() => {
        const groups: Record<string, { total: number, completed: number, title: string, nextSession: string | null, id: string, isLegacy: boolean }> = {};

        tasks.forEach(t => {
            if (t.category !== 'study') return;
            // STRICT FILTER: Ignore "Projects" (Assignments) from this view. They belong in the AssignmentWidget.
            if (t.type === 'project') return;

            // Try to find the "Exam" name from the title
            let groupName = t.title.replace('🏆 ', '').replace('📚 למידה: ', '');
            // Simple key
            const key = t.groupId || groupName;
            const isLegacy = !t.groupId;

            if (!groups[key]) {
                groups[key] = { total: 0, completed: 0, title: groupName, nextSession: null, id: key, isLegacy };
            }

            groups[key].total++;
            if (t.completed) groups[key].completed++;

            // Calc next session
            if (!t.completed && !t.title.includes('🏆')) {
                if (!groups[key].nextSession || t.scheduledDate < groups[key].nextSession!) {
                    groups[key].nextSession = t.scheduledDate;
                }
            }
        });

        return Object.values(groups).sort((a, b) => {
            // Sort by having a next session first
            if (a.nextSession && !b.nextSession) return -1;
            if (!a.nextSession && b.nextSession) return 1;
            return 0;
        }).slice(0, 3); // Top 3
    }, [tasks]);

    const handleDelete = (groupId: string, isLegacy: boolean, title: string) => {
        if (confirm('בטוח שאתה רוצה למחוק את כל הקורס הזה?')) {
            if (isLegacy) {
                deleteStudyGroupByTitle(title);
            } else {
                deleteTaskGroup(groupId);
            }
        }
    };

    if (studyGroups.length === 0) {
        return (
            <div className="h-full p-5 flex flex-col items-center justify-center text-center relative group">
                <h3 className="absolute top-5 right-5 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <GraduationCap size={18} className="text-purple-500" />
                    התקדמות
                </h3>

                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500">
                        <GraduationCap size={24} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">אין מבחנים פעילים</p>
                    <button
                        onClick={onAdd}
                        className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={14} /> צור תוכנית למידה
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full p-5 flex flex-col relative">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <GraduationCap size={18} className="text-purple-500" />
                    התקדמות לימודית
                </h3>
                <button
                    onClick={onAdd}
                    className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors"
                    title="צור תוכנית חדשה"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="space-y-4 flex-1 overflow-auto scrollbar-hide">
                {studyGroups.map((g) => {
                    const progress = Math.round((g.completed / g.total) * 100) || 0;
                    return (
                        <div key={g.id} className="group relative bg-white dark:bg-slate-800/50 rounded-xl p-2 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">

                            {/* Actions overlay on hover */}
                            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (onManage) onManage(g.id); }}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:text-indigo-600 hover:bg-indigo-50"
                                    title="ערוך תוכנית"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(g.id, g.isLegacy, g.title); }}
                                    className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:text-red-600 hover:bg-red-50"
                                    title="מחק תוכנית"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                <span>{g.title}</span>
                                <span className="text-purple-600">{progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                                <div
                                    className="h-full bg-purple-500 rounded-full transition-all duration-700 group-hover:bg-purple-400"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            {g.nextSession && (
                                <div className="text-[10px] text-slate-400 flex justify-between">
                                    <span>סשן הבא: {g.nextSession}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
