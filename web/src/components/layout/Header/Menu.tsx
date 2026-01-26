"use client";

import React from 'react';

export function Menu() {
    return (
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-wt">
                <a href="/" className="hover:text-primary transition-colors text-wt">خانه</a>
                <a href="/real-estate" className="hover:text-primary transition-colors text-wt">املاک</a>
                <a href="/blogs" className="hover:text-primary transition-colors text-wt">مجله خبری</a>
            </nav>
    );
}
