"use client";

import TaskInput from "@/components/TaskInput";
import StatsPanel from "@/components/StatsPanel";
import Timeline from "@/components/Timeline";
import LifeHappenedModal from "@/components/LifeHappenedModal";
import FocusMode from "@/components/FocusMode";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WeeklyTabs from '@/components/WeeklyTabs';
import TaskCompletionModal from "@/components/TaskCompletionModal";
import { Plus } from 'lucide-react';
import DailyPlanWizard from '@/components/DailyPlanWizard';
import DailySummaryWizard from '@/components/DailySummaryWizard';
import CategoryTabs from '@/components/CategoryTabs';

export default function Home() {
  const { tasks, scheduleTasks, selectedDate, editingTaskId, setEditingTask, dayStatus } = useStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [isInputOpen, setIsInputOpen] = useState(false); // Collapsible State

  // Hydration fix for Zustand persist
  useEffect(() => {
    setMounted(true);

    // Auth Check
    const checkAuth = async () => {
      const { supabase } = await import('@/lib/supabase');

      if (!supabase) {
        router.push('/login');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        useStore.getState().fetchTasks();
      }
    };

    checkAuth();
  }, [router]);

  if (!mounted) {
    return null;
  }

  // Filter tasks for the selected date and category
  const todayStr = new Date().toISOString().split('T')[0];
  const { activeCategoryFilter } = useStore(); // Destructure filter

  const filteredTasks = tasks.filter(t => {
    // 1. Date Filter
    const isDateMatch = t.scheduledDate ? t.scheduledDate === selectedDate : selectedDate === todayStr;
    if (!isDateMatch) return false;

    // 2. Category Filter
    if (activeCategoryFilter !== 'all') {
      const taskCat = t.category || 'other'; // Handle legacy/missing categories
      if (taskCat !== activeCategoryFilter) return false;
    }

    return true;
  }).sort((a, b) => {
    // 1. Completed First (User Request: "ראש המשימות")
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;

    // 2. Chronological by Start Time
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1; // Schedules first
    if (b.startTime) return 1;

    return 0;
  });

  const editingTask = tasks.find(t => t.id === editingTaskId);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden direction-rtl" dir="rtl">
      <FocusMode />
      <TaskCompletionModal />

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <TaskInput
              initialData={editingTask}
              onClose={() => setEditingTask(null)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full max-w-[1800px] mx-auto p-4 md:p-8 h-full">
        {/* Main Area: Timeline (First on Mobile) */}
        <div className="md:col-span-8 flex flex-col min-h-0 bg-white dark:bg-slate-900/50 rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm order-1 md:order-2 h-[60vh] md:h-auto">
          {/* Header with Weekly Tabs */}
          <div className="mb-4 md:mb-6 space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-xl md:text-2xl font-black px-2">הלו"ז שלי</h2>
              <WeeklyTabs />
            </div>
            <CategoryTabs />
          </div>

          {/* Scrollable Timeline */}
          <div className="flex-1 overflow-y-auto pr-2 pl-2 -mr-2 scrollbar-none">
            <Timeline tasks={filteredTasks} />
          </div>
        </div>

        {/* Sidebar Area: Input & Stats (Second on Mobile) */}
        <div className="md:col-span-4 flex flex-col gap-4 md:gap-6 overflow-y-auto pb-20 scrollbar-hide order-2 md:order-1">
          <StatsPanel />

          {/* Collapsible Task Input */}
          {isInputOpen ? (
            <div className="animate-in slide-in-from-top-10 fade-in duration-300">
              <TaskInput onClose={() => setIsInputOpen(false)} />
            </div>
          ) : (
            <button
              onClick={() => setIsInputOpen(true)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} /> הוסף משימה חדשה
            </button>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Show Daily Plan Wizard if in Planning Mode */}
            {dayStatus === 'planning' && <DailyPlanWizard />}

            <DailySummaryWizard />

            {/* Legacy/Manual Scheduling Buttons - Maybe hide these if Wizard handles it? 
                Let's keep them but make them less prominent or secondary. 
                Actually, the user asked to REPLACE the buttons with one "Create Schedule" button in the wizard.
                So in planning mode, the wizard handles it. In active mode, maybe we don't need them visible constantly?
                Let's keep them as "Manual Overrides" for now.
            */}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">כלים נוספים</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="bg-white dark:bg-slate-800 text-xs py-2 rounded-lg border hover:bg-slate-50"
                  onClick={() => scheduleTasks('eat-the-frog')}
                >
                  🐸 צפרדע
                </button>
                <button
                  className="bg-white dark:bg-slate-800 text-xs py-2 rounded-lg border hover:bg-slate-50"
                  onClick={() => scheduleTasks('snowball')}
                >
                  ❄️ כדור שלג
                </button>
              </div>
              <div className="mt-2">
                <LifeHappenedModal />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
