"use client";

import SmartStudyHub from '@/components/SmartStudyHub';
import { useRouter } from 'next/navigation';

export default function StudyPage() {
    const router = useRouter();

    // onBack goes to dashboard, or maybe just stays? 
    // Usually on a dedicated page onBack might not be needed or should act as browser back.
    // Given the component design, it might have a back button.

    return (
        <SmartStudyHub onBack={() => router.push('/dashboard')} />
    );
}
