"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Determine where to go. 
    // Ideally, middleware handles auth, but client-side:
    // We just push to dashboard. The dashboard layout handles auth check.
    router.replace('/dashboard');
  }, [router]);

  return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">Please wait...</div>;
}
