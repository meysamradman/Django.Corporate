"use client";

import dynamic from 'next/dynamic';

const AIChat = dynamic(
  () => import('@/components/ai/chat').then(mod => ({ default: mod.AIChat })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div> }
);

export default function AIChatPage() {
    return (
        <div className="container mx-auto py-6">
            <AIChat />
        </div>
    );
}

