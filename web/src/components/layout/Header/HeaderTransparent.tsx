"use client";

import React from 'react';
import { Logo } from '../Logo';

export function HeaderTransparent() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 lg:px-12 bg-transparent transition-all duration-300">
            <Logo />

            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-white">
                <a href="/" className="hover:text-primary transition-colors">خانه</a>
                <a href="/real-estate" className="hover:text-primary transition-colors">املاک</a>
                <a href="/blogs" className="hover:text-primary transition-colors">مجله خبری</a>
            </nav>

            <div className="flex items-center gap-4">
                {/* Auth status placeholders can go here if needed later */}
            </div>
        </header>
    );
}
