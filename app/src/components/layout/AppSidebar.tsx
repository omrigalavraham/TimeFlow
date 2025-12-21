"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    CheckSquare,
    GraduationCap,
    Zap,
    BarChart2,
    Settings,
    LogOut,
    Menu,
    Plus,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { useStore } from '@/lib/store';

const MENU_ITEMS = [
    { label: 'לוח בקרה', icon: Home, href: '/dashboard' },
    { label: 'משימות', icon: CheckSquare, href: '/tasks' },
    { label: 'קמפוס', icon: GraduationCap, href: '/study' },
    { label: 'פוקוס', icon: Zap, href: '/focus' },
    { label: 'תובנות', icon: BarChart2, href: '/insights' },
];

export default function AppSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
    const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile drawer

    // Auto-close mobile drawer on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header Trigger (Only visible on small screens) */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                        TF
                    </div>
                    <span className="font-bold text-lg text-slate-800 dark:text-white">TimeFlow</span>
                </div>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed md:sticky top-0 right-0 h-screen bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-50 shadow-2xl md:shadow-none",
                    // Mobile: Hide by default, slide in if open
                    !isMobileOpen && "translate-x-full md:translate-x-0 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto",
                    isMobileOpen && "translate-x-0 opacity-100 pointer-events-auto",
                    // Width control
                    isCollapsed ? "md:w-20" : "w-64"
                )}
            >
                {/* Desktop Header / Mobile Close */}
                <div className="p-6 flex items-center justify-between">
                    <div className={cn("flex items-center gap-2 overflow-hidden", isCollapsed && "md:hidden")}>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            TF
                        </div>
                        <span className="font-bold text-xl text-slate-800 dark:text-white whitespace-nowrap">
                            TimeFlow
                        </span>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                    >
                        <X size={20} />
                    </button>

                    {/* Desktop Collapse Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                                )}
                            >
                                <item.icon size={22} className={cn("shrink-0", isActive && "fill-current opacity-20")} />

                                <span className={cn(
                                    "transition-all duration-200",
                                    isCollapsed && "md:hidden" // Hide label on collapsed desktop
                                )}>
                                    {item.label}
                                </span>

                                {/* Tooltip for collapsed mode (Desktop Only) */}
                                {isCollapsed && (
                                    <div className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}

                    {/* Quick Add Button */}
                    <button
                        onClick={() => {
                            useStore.getState().setIsTaskInputOpen(true);
                            setIsMobileOpen(false);
                        }}
                        className={cn(
                            "mt-4 flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative font-bold shadow-md shadow-indigo-500/20",
                            "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30",
                            isCollapsed ? "md:px-0 md:aspect-square" : "w-full"
                        )}
                    >
                        <Plus size={22} className="shrink-0 text-white" />

                        <span className={cn(
                            "transition-all duration-200",
                            isCollapsed && "md:hidden"
                        )}>
                            משימה חדשה
                        </span>

                        {/* Tooltip for collapsed mode */}
                        {isCollapsed && (
                            <div className="hidden md:block absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                משימה חדשה
                            </div>
                        )}
                    </button>

                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className={cn("flex items-center justify-between", isCollapsed && "md:flex-col md:gap-4")}>
                        <ThemeToggle />
                        <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="התנתק">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
