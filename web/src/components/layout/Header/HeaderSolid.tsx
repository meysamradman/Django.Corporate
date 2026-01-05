"use client";

import React from 'react';
import { Logo } from '../Logo';

export function HeaderSolid() {
    return (
        <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 bg-header border-b transition-all">
            <Logo />

            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-font-p">
                <a href="/" className="hover:text-primary transition-colors">خانه</a>
                <a href="/real-estate" className="hover:text-primary transition-colors text-primary">املاک</a>
                <a href="/blogs" className="hover:text-primary transition-colors">مجله خبری</a>
            </nav>

            <div className="flex items-center gap-4">
            </div>
        </header>
    );
}
