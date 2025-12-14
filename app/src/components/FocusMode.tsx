"use client";

import { useEffect, useState, useRef } from 'react';
import { useStore, Task } from '@/lib/store';
import { Play, Pause, Square, CheckCircle, Minimize2, Maximize2, X, Headphones, Volume2, VolumeX, CloudRain, Trees, Coffee, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const SOUNDS = [
    { id: 'rain', label: 'גשם', icon: CloudRain, url: 'https://assets.mixkit.co/active_storage/sfx/2498/2498-preview.mp3' },
    { id: 'forest', label: 'יער', icon: Trees, url: 'https://assets.mixkit.co/active_storage/sfx/2493/2493-preview.mp3' },
    { id: 'white_noise', label: 'רעש לבן', icon: Waves, url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' }, // Placeholder for noise
];


export default function FocusMode() {
    const { tasks, activeTaskId, setActiveTask, toggleTaskCompletion, streak } = useStore();
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
                audioRef.current = null;
            }
        }
    }, []);

    // Initialize Timer
    useEffect(() => {
        if (activeTask && mode === 'focus') {
            setTimeLeft(activeTask.duration * 60);
            setElapsedTime(0); // Reset elapsed
            setIsActive(true);
            setIsPaused(false);
            setIsMinimized(false);
            setInsight(null);
        }
    }, [activeTaskId, mode]);

    // Timer Tick
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if ((mode === 'focus' || mode === 'break') && isActive && !isPaused && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const next = prev - 1;

                    // Increment elapsed only in focus mode
                    if (mode === 'focus') setElapsedTime(e => e + 1);

                    // Smart Insights (Only in Focus Mode)
                    if (mode === 'focus' && activeTask) {
                        const midPoint = (activeTask.duration * 60) / 2;
                        if (next === midPoint) setInsight("חצי דרך מאחוריך! 💪");
                        if (next === 60) setInsight("דקה אחרונה! תן בראש 🔥");
                    }
                    return next;
                });
            }, 1000);
        } else if (timeLeft === 0 && mode === 'focus' && isActive) {
            // Overtime
            setInsight("חריגה בזמן ⌛ - רוצה להוסיף 5 דקות?");
            // Continue counting elapsed time in overtime
            interval = setInterval(() => {
                setElapsedTime(e => e + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isPaused, timeLeft, mode, activeTask]);

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

    const handleComplete = () => {
        if (activeTask) {
            // Save actual duration (in minutes)
            const actualMinutes = Math.ceil(elapsedTime / 60);
            useStore.getState().updateTask(activeTask.id, { actualDuration: actualMinutes });

            // Mark as done
            toggleTaskCompletion(activeTask.id);

            // Trigger Global Modal for Feedback
            useStore.getState().openCompletionModal(activeTask.id, elapsedTime);

            // Exit Focus Mode
            setActiveTask(null);
            setMode('focus');
            setIsActive(false);
        }
    };

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
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-500">
            {/* Gradient Background */}
            <div className={cn(
                "absolute inset-0 opacity-20 dark:opacity-10 transition-all duration-1000 pointer-events-none bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient",
                isPaused && "opacity-0"
            )} />

            {/* Minimize / Exit / SOUND CONTROLS */}
            <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
                {/* Sound Button */}
                <div className="relative group">
                    <button
                        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md shadow-sm border transition-all",
                            isSoundEnabled
                                ? "bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800"
                                : "bg-white/80 dark:bg-black/40 text-slate-500 border-slate-200 dark:border-slate-800"
                        )}
                        title="סאונד לפוקוס"
                    >
                        {isSoundEnabled ? <Volume2 size={18} /> : <Headphones size={18} />}
                    </button>

                    {/* Sound Menu (Hover/Group) */}
                    <div className="absolute top-12 right-0 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pointer-events-none">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soundscapes</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {SOUNDS.map(sound => {
                                    const Icon = sound.icon;
                                    const isSelected = selectedSoundId === sound.id;
                                    return (
                                        <button
                                            key={sound.id}
                                            onClick={() => {
                                                setSelectedSoundId(sound.id);
                                                setIsSoundEnabled(true);
                                            }}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-2 rounded-lg transition-all text-xs font-medium",
                                                isSelected
                                                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                                            )}
                                        >
                                            <Icon size={20} />
                                            {sound.label}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Volume Slider */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <VolumeX size={14} className="text-slate-400" />
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={soundVolume}
                                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                                    className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 cursor-pointer"
                                />
                                <Volume2 size={14} className="text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsMinimized(true)}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2 bg-white/80 dark:bg-black/40 px-4 py-2 rounded-full backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <Minimize2 size={18} /> <span className="hidden sm:inline">מזער</span>
                </button>
                <button
                    onClick={() => setActiveTask(null)}
                    className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors bg-white/80 dark:bg-black/40 rounded-full backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Smart Insight Toast */}
            {insight && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 flex items-center gap-3">
                        <span className="text-xl">✨</span>
                        <span className="font-medium">{insight}</span>
                        {/* Allow click to add time if overtime */}
                        {insight.includes("להוסיף") && (
                            <button onClick={() => setTimeLeft(l => l + 300)} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs ml-2">כן, הוסף 5 דק'</button>
                        )}
                    </div>
                </div>
            )}

            <div className="relative z-10 w-full max-w-2xl px-8 text-center space-y-12">

                {/* Task Title */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 mb-4 backdrop-blur-sm border border-purple-200 dark:border-purple-800">
                        כרגע עובדים על
                    </div>
                    {/* Add fallback title if activeTask is missing (should not happen due to guard) */}
                    <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white leading-tight">
                        {activeTask?.title || "משימה"}
                    </h1>
                </div>

                {/* Timer Display */}
                <div className={cn(
                    "font-mono text-[8rem] md:text-[12rem] leading-none tracking-tighter font-bold tabular-nums drop-shadow-sm select-none transition-colors",
                    timeLeft === 0 ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-white"
                )}>
                    {timeString}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-110 active:scale-95 shadow-sm"
                    >
                        {isPaused ? <Play size={32} className="ml-1" /> : <Pause size={32} />}
                    </button>

                    <button
                        onClick={handleComplete}
                        className="px-8 py-6 rounded-full bg-slate-900 dark:bg-green-600 text-white hover:bg-slate-800 dark:hover:bg-green-700 transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-3 text-xl font-bold"
                    >
                        <CheckCircle size={24} /> סיימתי!
                    </button>
                </div>
            </div>
        </div>
    );
}
