"use client";

import AppSidebar from "@/components/layout/AppSidebar";
import FocusMode from "@/components/FocusMode";
import ReminderManager from "@/components/ReminderManager";
import TaskCompletionModal from "@/components/TaskCompletionModal";
import LifeHappenedModal from "@/components/LifeHappenedModal";
import TaskInput from "@/components/TaskInput";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const isTaskInputOpen = useStore((state) => state.isTaskInputOpen);

    useEffect(() => {
        setMounted(true);
        const checkAuth = async () => {
            const { supabase } = await import('@/lib/supabase');
            if (!supabase) {
                // Dev mode or mock
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

    if (!mounted) return null;

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden direction-rtl" dir="rtl">
            {/* Sidebar */}
            <AppSidebar />

            {/* Mobile Header Spacer - MUST be outside sidebar */}
            <div className="md:hidden h-16 w-full shrink-0 absolute top-0 left-0 right-0 pointer-events-none z-0" />

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto h-full scrollbar-hide pt-16 md:pt-0">
                {children}
            </main>

            {/* Global Overlays */}
            <FocusMode />
            <ReminderManager />
            <TaskCompletionModal />

            {/* Global Task Input Modal */}
            {isTaskInputOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <TaskInput onClose={() => useStore.getState().setIsTaskInputOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}
