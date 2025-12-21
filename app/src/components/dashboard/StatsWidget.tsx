"use client";

import { useStore } from '@/lib/store';
import { Trophy, Flame } from 'lucide-react';

export function StatsWidget() {
    const { xp, streak } = useStore();

    // Level Calc
    const currentLevel = Math.floor(xp / 1000) + 1;
    const progress = (xp % 1000) / 10; // Percentage 0-100
    const nextLevelXp = 1000 - (xp % 1000);

    return (
        <div className="h-full w-full p-6 flex flex-col justify-between bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/10 relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="flex justify-between items-start relative z-10">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-900/5 group-hover:scale-110 transition-transform duration-500">
                    <Trophy size={22} className="text-amber-500" />
                </div>
                <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full ring-1 ring-white/50 border border-white/20">
                    <Flame size={16} className="text-orange-500 fill-orange-500 animate-[bounce_2s_infinite]" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{streak} ימים</span>
                </div>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-end mb-1">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">דרגה {currentLevel}</div>
                    <div className="text-[10px] font-bold text-indigo-500">עוד {nextLevelXp} נקודות</div>
                </div>

                <div className="w-full bg-slate-200/50 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-1000 relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />
                    </div>
                </div>

                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-medium">
                    <span>טירון</span>
                    <span>מאסטר</span>
                </div>
            </div>
        </div>
    );
}
