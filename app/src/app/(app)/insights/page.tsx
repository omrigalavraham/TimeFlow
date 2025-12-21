"use client";

import StatsPanel from "@/components/StatsPanel";
import { useStore } from "@/lib/store";
import { TrendingUp, Award, Calendar, Clock } from "lucide-react";

export default function InsightsPage() {
    const { level, streak, xp } = useStore();

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <TrendingUp size={32} className="text-purple-600" />
                    תובנות וסטטיסטיקה
                </h1>
                <p className="text-slate-500">עקוב אחר הביצועים וההתקדמות שלך</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gamification Stats */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Award className="text-amber-500" />
                        פרופיל משתמש
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{level}</div>
                            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">רמה</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                            <div className="text-3xl font-black text-orange-500">{streak}</div>
                            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">רצף ימים</div>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-sm font-medium">סה"כ נקודות ניסיון</span>
                        <span className="font-mono font-bold text-purple-600">{xp} XP</span>
                    </div>
                </div>

                {/* Daily Overview (Reusing Component logic) */}
                <div className="md:col-span-2">
                    <StatsPanel />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full">
                        <Calendar size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">ניתוח שבועי</h4>
                        <p className="text-slate-400 text-sm">הפיצ'ר בפיתוח - בקרוב תוכל לראות גרף התקדמות שבועי</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                    <div className="p-4 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-full">
                        <Clock size={32} />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">זמני שיא</h4>
                        <p className="text-slate-400 text-sm">הפיצ'ר בפיתוח - בקרוב ננתח מתי אתה הכי פרודוקטיבי</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
