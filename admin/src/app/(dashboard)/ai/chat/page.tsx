"use client";

import dynamic from 'next/dynamic';
import { Loader } from '@/components/elements/Loader';

const AIChat = dynamic(
  () => import('@/components/ai/chat').then(mod => ({ default: mod.AIChat })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><Loader /></div> }
);

export default function AIChatPage() {
    return (
        <div className="container mx-auto py-6">
            <AIChat />
        </div>
    );
}

