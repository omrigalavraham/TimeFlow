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
import DailySummaryWizard from '@/components/DailySummaryWizard';

export default function Home() {
  const { tasks, scheduleTasks, selectedDate, editingTaskId, setEditingTask } = useStore();
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

  // Filter tasks for the selected date
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredTasks = tasks.filter(t => {
    if (!t.scheduledDate) return selectedDate === todayStr;
    return t.scheduledDate === selectedDate;
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
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-black mb-4 px-2">הלו"ז שלי</h2>
            <WeeklyTabs />
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
            <DailySummaryWizard />

            <button
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-700 transition-colors transform hover:scale-[1.02] active:scale-95"
              onClick={() => scheduleTasks('eat-the-frog')}
            >
              ✨ צור לו"ז (אכול את הצפרדע)
            </button>
            <button
              className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors transform hover:scale-[1.02] active:scale-95"
              onClick={() => scheduleTasks('snowball')}
            >
              ❄️ צור לו"ז (כדור שלג)
            </button>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <LifeHappenedModal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
