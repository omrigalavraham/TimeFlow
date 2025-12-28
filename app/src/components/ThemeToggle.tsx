"use client";

import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Monitor, Cpu, Palette, ChevronDown, Sunset, Terminal, Gem } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "cyberpunk" | "retro";

const THEMES: { id: Theme; label: string; icon: any; color: string }[] = [
    { id: "light", label: "יום (בהיר)", icon: Sun, color: "bg-amber-100 text-amber-600" },
    { id: "dark", label: "לילה (כהה)", icon: Moon, color: "bg-slate-100 text-slate-600" },
    { id: "cyberpunk", label: "סייברפאנק 2077", icon: Cpu, color: "bg-black text-cyan-400 border border-cyan-500" },
    { id: "retro", label: "רטרו 80s", icon: Sunset, color: "bg-indigo-900 text-pink-500 border border-pink-500" },
];

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("light");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme") as Theme;
        if (storedTheme) {
            setTheme(storedTheme);
            applyTheme(storedTheme);
        } else {
            const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const initial = systemPrefersDark ? "dark" : "light";
            setTheme(initial);
            applyTheme(initial);
        }
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;

        // Reset classes
        root.classList.remove("dark", "theme-neon", "theme-cyberpunk", "theme-retro", "theme-terminal", "theme-crystal");

        if (newTheme === "dark") {
            root.classList.add("dark");
        } else if (newTheme !== "light") {
            // All special themes (cyberpunk, retro, terminal, crystal) use dark mode as base
            root.classList.add("dark");
            root.classList.add(`theme-${newTheme}`);
        }

        localStorage.setItem("theme", newTheme);
    };

    const handleThemeSelect = (newTheme: Theme) => {
        setTheme(newTheme);
        applyTheme(newTheme);
        setIsOpen(false);
    };

    const activeThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all font-medium text-sm text-slate-600 dark:text-slate-300"
            >
                <span className={cn("p-1 rounded-full", activeThemeObj.color)}>
                    <activeThemeObj.icon size={14} />
                </span>
                <span className="hidden md:inline">{activeThemeObj.label}</span>
                <ChevronDown size={14} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-1 z-50 overflow-hidden"
                    >
                        {THEMES.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleThemeSelect(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                                    theme === item.id
                                        ? "bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400"
                                )}
                            >
                                <div className={cn("p-1.5 rounded-full", item.color)}>
                                    <item.icon size={14} />
                                </div>
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
