"use client";

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useStore, Task } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { Play, Pause, Square, CheckCircle, Minimize2, Maximize2, X, Headphones, Volume2, VolumeX, CloudRain, Trees, Coffee, Waves, Palette, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const SOUNDS = [
    { id: 'rain', label: 'גשם', icon: CloudRain, url: 'https://assets.mixkit.co/active_storage/sfx/2498/2498-preview.mp3' },
    { id: 'forest', label: 'יער', icon: Trees, url: 'https://assets.mixkit.co/active_storage/sfx/2493/2493-preview.mp3' },
    { id: 'white_noise', label: 'רעש לבן', icon: Waves, url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
];

const THEMES = [
    { id: 'flow', label: 'זרימה', gradient: 'from-indigo-500 via-purple-500 to-pink-500', minLevel: 1 },
    { id: 'ocean', label: 'אוקיינוס (רמה 2)', gradient: 'from-cyan-500 via-blue-500 to-indigo-500', minLevel: 2 },
    { id: 'forest', label: 'יער (רמה 3)', gradient: 'from-emerald-500 via-green-500 to-teal-500', minLevel: 3 },
    { id: 'fire', label: 'אש (רמה 5)', gradient: 'from-orange-500 via-red-500 to-yellow-500', minLevel: 5 },
    { id: 'midnight', label: 'חצות (רמה 10)', gradient: 'from-slate-900 via-purple-900 to-black', minLevel: 10 },
];


export default function FocusMode() {
    // Consolidated store selectors for performance optimization
    const { tasks, activeTaskId, setActiveTask, toggleTaskCompletion, addXp, updateTask, openCompletionModal } = useStore(
        useShallow((state) => ({
            tasks: state.tasks,
            activeTaskId: state.activeTaskId,
            setActiveTask: state.setActiveTask,
            toggleTaskCompletion: state.toggleTaskCompletion,
            addXp: state.addXp,
            updateTask: state.updateTask,
            openCompletionModal: state.openCompletionModal,
        }))
    );
    const activeTask = tasks.find(t => t.id === activeTaskId);

    const [timeLeft, setTimeLeft] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0); // Track elapsed time
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Modes: 'focus' | 'transition' | 'break'
    const [mode, setMode] = useState<'focus' | 'transition' | 'break'>('focus');
    const [insight, setInsight] = useState<string | null>(null);

    // Sound State
    const [isSoundEnabled, setIsSoundEnabled] = useState(false);
    const [soundVolume, setSoundVolume] = useState(0.5);
    const [selectedSoundId, setSelectedSoundId] = useState('rain');
    const [selectedThemeId, setSelectedThemeId] = useState('flow');
    const [showThemeSelector, setShowThemeSelector] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Audio Control Effect
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }

        const audio = audioRef.current;
        const sound = SOUNDS.find(s => s.id === selectedSoundId);

        if (sound && audio.src !== sound.url) {
            audio.src = sound.url;
        }

        audio.volume = soundVolume;

        if (isSoundEnabled && isActive && !isPaused && mode === 'focus') {
            // Play only if active, focusing, and sound enabled
            audio.play().catch(e => console.error("Audio play failed", e));
        } else {
            audio.pause();
        }
    }, [isSoundEnabled, isActive, isPaused, mode, selectedSoundId, soundVolume]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        }
    }, []);

    const lastInitializedTaskId = useRef<string | null>(null);

    // Initialize Timer
    useEffect(() => {
        if (activeTask && activeTask.id !== lastInitializedTaskId.current) {
            // New Task Detected - Initialize
            lastInitializedTaskId.current = activeTask.id;

            if (activeTask.type === 'break') {
                setMode('break');
                setTimeLeft(activeTask.duration * 60);
                setElapsedTime(0);
                setIsActive(true);
                setIsPaused(false);
                setIsMinimized(false);
                setInsight(null);
            } else {
                setMode('focus');
                setTimeLeft(activeTask.duration * 60);
                setElapsedTime(0); // Reset elapsed
                setIsActive(true);
                setIsPaused(false);
                setIsMinimized(false);
                setInsight(null);
            }
        }
    }, [activeTask, mode]); // activeTask dependency is crucial now because it might be undefined at first render

    // Timer Tick
    // Timer Tick
    useEffect(() => {
        let interval: NodeJS.Timeout;

        // Active Timer
        if ((mode === 'focus' || mode === 'break') && isActive && !isPaused && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const next = prev - 1;
                    // Increment elapsed only in focus mode
                    if (mode === 'focus') {
                        setElapsedTime(e => e + 1);
                    }
                    return next;
                });
            }, 1000);
        } else if (timeLeft === 0 && mode === 'focus' && isActive) {
            // Overtime Timer (Count up)
            interval = setInterval(() => {
                setElapsedTime(e => e + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, isPaused, timeLeft, mode, activeTaskId]); // Use activeTaskId instead of activeTask object

    // Handle XP Growth
    useEffect(() => {
        if (mode === 'focus' && elapsedTime > 0 && elapsedTime % 60 === 0) {
            addXp(1);
        }
    }, [elapsedTime, mode, addXp]);

    // Insight & Notifications Logic
    useEffect(() => {
        if (mode === 'focus' && activeTask) {
            if (timeLeft > 0) {
                const midPoint = (activeTask.duration * 60) / 2;
                if (timeLeft === midPoint) setInsight("חצי דרך מאחוריך! 💪");
                if (timeLeft === 60) setInsight("דקה אחרונה! תן בראש 🔥");
            } else if (timeLeft === 0 && isActive) {
                // Overtime Trigger
                setInsight("חריגה בזמן ⌛ - רוצה להוסיף 5 דקות?");
            }
        }
    }, [timeLeft, mode, activeTask, isActive]);

    // Clear insight after 5 seconds
    useEffect(() => {
        if (insight) {
            const timer = setTimeout(() => setInsight(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [insight]);

    // Guard: If no active task, do not render Focus Mode
    if (!activeTask) return null;

    // Helper: Find next task
    const handleNextTask = () => {
        const remaining = tasks.filter(t => !t.completed && t.id !== activeTaskId);
        // Reuse current sorting logic implicitly or just take next in list? 
        // For simple UX, finding the next one in array index is safest if we assume array is sorted.
        // Or finding the next "must/should/could". 
        // Let's just grab the first uncompleted one.
        if (remaining.length > 0) {
            setActiveTask(remaining[0].id);
            setMode('focus');
        } else {
            // No more tasks!
            setActiveTask(null);
        }
    };

    const startBreak = (minutes: number) => {
        setMode('break');
        setTimeLeft(minutes * 60);
        setIsActive(true);
        setIsPaused(false);
    }

    const handleComplete = useCallback(() => {
        if (activeTask) {
            // Save actual duration (in minutes)
            const actualMinutes = Math.ceil(elapsedTime / 60);
            updateTask(activeTask.id, { actualDuration: actualMinutes });

            // Mark as done
            toggleTaskCompletion(activeTask.id);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });

            // Trigger Global Modal for Feedback
            openCompletionModal(activeTask.id, elapsedTime);

            // Exit Focus Mode
            setActiveTask(null);
            setMode('focus');
            setIsActive(false);
        }
    }, [activeTask, elapsedTime, updateTask, toggleTaskCompletion, openCompletionModal, setActiveTask]);

    // Format Time
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // --- Mini Player View ---
    if (isMinimized && mode === 'focus' && activeTask) {
        return (
            <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 border border-slate-700 w-full max-w-sm">
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 font-medium mb-0.5">בפוקוס על</div>
                    <div className="font-bold truncate">{activeTask.title}</div>
                </div>
                <div className="font-mono text-2xl font-bold text-purple-400">{timeString}</div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPaused(!isPaused)} className="p-2 hover:bg-white/10 rounded-full">{isPaused ? <Play size={18} /> : <Pause size={18} />}</button>
                    <button onClick={handleComplete} className="p-2 hover:bg-green-500/20 text-green-400 rounded-full"><CheckCircle size={18} /></button>
                    <button onClick={() => setIsMinimized(false)} className="p-2 hover:bg-white/10 rounded-full"><Maximize2 size={18} /></button>
                </div>
            </div>
        );
    }

    // --- Break View ---
    if (mode === 'break') {
        return (
            <div className="fixed inset-0 z-50 bg-teal-950 text-white flex flex-col items-center justify-center transition-colors duration-1000">
                <div className="text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="text-2xl font-medium text-teal-200 uppercase tracking-widest">זמן הפסקה</div>
                    <div className="font-mono text-[10rem] font-bold tabular-nums leading-none">{timeString}</div>
                    <p className="text-teal-400 text-lg">זמן למלא מצברים...</p>
                    <button onClick={handleNextTask} className="bg-white text-teal-900 px-8 py-3 rounded-full font-bold hover:scale-105 transition-all">
                        נגמרה ההפסקה? למשימה הבאה
                    </button>
                </div>
            </div>
        )
    }

    // --- Active Focus View (Standard) ---
    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-500 overflow-hidden">
            {/* Gradient Background - Animated Breathing */}
            <FocusBackground
                selectedThemeId={selectedThemeId}
                isActive={isActive}
                isPaused={isPaused}
            />

            <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-[30px]" />

            {/* Smart Insight Toast */}
            <AnimatePresence>
                {insight && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-12 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="bg-slate-900/90 text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 backdrop-blur-md">
                            <span className="text-xl animate-pulse">✨</span>
                            <span className="font-medium">{insight}</span>
                            {/* Allow click to add time if overtime */}
                            {insight.includes("להוסיף") && (
                                <button onClick={() => setTimeLeft(l => l + 300)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-xs ml-2 transition-colors">כן, הוסף 5 דק'</button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Main Content */}
            <div className="relative z-10 w-full max-w-4xl px-8 text-center flex flex-col items-center min-h-screen justify-center pb-32">

                {/* Task Context */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-slate-900/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 backdrop-blur-sm border border-slate-200/50 dark:border-white/10">
                        <div className={cn("w-2 h-2 rounded-full", isPaused ? "bg-amber-500" : "bg-green-500 animate-pulse")} />
                        {isPaused ? 'מושהה' : 'בפוקוס'}
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight tracking-tight drop-shadow-sm max-w-3xl px-2">
                        {activeTask?.title || "משימה"}
                    </h1>
                </motion.div>

                {/* Timer Display - Massive */}
                <div className={cn(
                    "font-mono text-[6rem] md:text-[14rem] leading-none tracking-tighter font-bold tabular-nums select-none transition-all duration-500",
                    timeLeft === 0 ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-white opacity-90",
                    isPaused && "opacity-50 blur-[2px]"
                )}>
                    {timeString}
                </div>
            </div>


            {/* Floating Island Control Bar */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 md:gap-4 bg-white/80 dark:bg-black/60 backdrop-blur-2xl p-2 md:p-3 pr-4 pl-4 md:pr-6 md:pl-6 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-black/5 w-[90%] md:w-auto overflow-x-auto md:overflow-visible scrollbar-hide justify-between md:justify-start"
            >
                {/* 1. Theme Selector */}
                <div className="relative group flex items-center">
                    <button className="p-3 text-slate-500 hover:text-indigo-500 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">
                        <Palette size={20} />
                    </button>
                    {/* Theme Popup (Upwards) */}
                    <div className="absolute bottom-full left-0 mb-4 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-bottom-left">
                        <div className="grid grid-cols-1 gap-1">
                            {THEMES.map(theme => (
                                <button key={theme.id} onClick={() => setSelectedThemeId(theme.id)} className={cn("flex items-center gap-3 p-2 rounded-lg text-xs font-bold transition-colors", selectedThemeId === theme.id ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-500")}>
                                    <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", theme.gradient)} /> {theme.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Sound Selector */}
                <div className="relative group flex items-center border-l border-slate-200 dark:border-white/10 pl-4 ml-2">
                    <button className={cn("p-3 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-white/10", isSoundEnabled ? "text-indigo-500" : "text-slate-500")}>
                        {isSoundEnabled ? <Volume2 size={20} /> : <Headphones size={20} />}
                    </button>
                    {/* Sound Popup */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-bottom">
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {SOUNDS.map(s => (
                                <button key={s.id} onClick={() => { setSelectedSoundId(s.id); setIsSoundEnabled(true); }} className={cn("flex flex-col items-center gap-2 p-2 rounded-xl text-[10px] font-bold transition-colors", selectedSoundId === s.id ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100" : "bg-slate-50 text-slate-400")}>
                                    <s.icon size={16} /> {s.label}
                                </button>
                            ))}
                        </div>
                        <input type="range" min="0" max="1" step="0.1" value={soundVolume} onChange={(e) => setSoundVolume(parseFloat(e.target.value))} className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                    </div>
                </div>

                {/* 3. Main Action Play/Pause (Center, Large) */}
                <div className="px-4">
                    <button onClick={() => setIsPaused(!isPaused)} className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl">
                        {isPaused ? <Play size={28} className="ml-1" /> : <Pause size={28} />}
                    </button>
                </div>

                {/* 4. Complete / Break Buttons */}
                <div className="flex items-center gap-2 border-r border-slate-200 dark:border-white/10 pr-4 mr-2">
                    <div className="relative group">
                        <button className="p-3 text-slate-500 hover:text-orange-500 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-white/10">
                            <Coffee size={20} />
                        </button>
                        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-4 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-bottom">
                            {[5, 15, 30].map(m => (
                                <button key={m} onClick={() => startBreak(m)} className="w-full text-right px-3 py-2 hover:bg-slate-50 rounded-lg text-sm font-bold text-slate-600">הפסקה {m} דק'</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. Complete / Exit */}
                <div className="flex items-center gap-2">
                    <button onClick={handleComplete} className="p-3 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors" title="סיים משימה"><CheckCircle size={20} /></button>
                    <button onClick={() => setIsMinimized(true)} className="p-3 text-slate-400 hover:text-slate-600 rounded-xl transition-colors" title="מזער"><Minimize2 size={20} /></button>
                    <button onClick={() => setActiveTask(null)} className="p-3 text-slate-400 hover:text-red-500 rounded-xl transition-colors" title="צא"><X size={20} /></button>
                </div>
            </motion.div>

        </div>
    );
}

const FocusBackground = memo(({ selectedThemeId, isActive, isPaused }: { selectedThemeId: string, isActive: boolean, isPaused: boolean }) => {
    return (
        <>
            {THEMES.map(theme => (
                <motion.div
                    key={theme.id}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: selectedThemeId === theme.id && !isPaused ? 0.6 : 0,
                        scale: isActive && !isPaused ? [1, 1.2, 1] : 1, // Breathing effect
                    }}
                    transition={{
                        opacity: { duration: 1 },
                        scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className={cn(
                        "absolute inset-0 pointer-events-none bg-gradient-to-br",
                        theme.gradient
                    )}
                />
            ))}
        </>
    );
});
FocusBackground.displayName = 'FocusBackground';

