"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LifeHappenedModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [minutes, setMinutes] = useState('15');
    const handleDelay = useStore((state) => state.handleDelay);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const delay = parseInt(minutes);
        if (!isNaN(delay) && delay > 0) {
            handleDelay(delay);
            setIsOpen(false);
            setMinutes('15');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full text-red-600 hover:bg-red-50 hover:dark:bg-red-900/20 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
                <AlertTriangle size={16} /> בלת״מ (עדכון לו״ז)
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">משהו קפץ?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                אל דאגה, קורה לכולם. כמה זמן התעכבת?
                                <br />
                                אנחנו נזיז את שאר היום בהתאם.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={minutes}
                                    onChange={(e) => setMinutes(e.target.value)}
                                    className="w-full text-center text-3xl font-bold py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800 dark:text-white"
                                    autoFocus
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">דקות</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[15, 30, 45, 60].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMinutes(m.toString())}
                                        className={cn(
                                            "py-2 px-3 rounded-lg text-sm font-medium transition-colors border",
                                            minutes === m.toString()
                                                ? "bg-red-500 text-white border-red-500"
                                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        {m} דק'
                                    </button>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-red-500/20"
                            >
                                עדכן לוח זמנים
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
