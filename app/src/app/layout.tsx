import type { Metadata } from "next";
import { Rubik } from "next/font/google"; // Changed to Rubik for better Hebrew support
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

const rubik = Rubik({ subsets: ["latin", "hebrew"] });

export const metadata: Metadata = {
  title: "TimeFlow - Productivity Assistant",
  description: "Minimalist daily planner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="transition-colors duration-200">
      <body className={`${rubik.className} min-h-screen bg-[#F8F9FA] dark:bg-slate-950 transition-colors duration-200`}>
        <main className="container mx-auto py-8 px-4">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                Time<span className="text-purple-600">Flow</span>
              </h1>
              <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                התמקד במה שחשוב
              </div>
            </div>
            <ThemeToggle />
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}

