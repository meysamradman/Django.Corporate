import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react'; // Placeholder icon for logo

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105">
                <Home size={24} />
            </div>
        </Link>
    );
}
