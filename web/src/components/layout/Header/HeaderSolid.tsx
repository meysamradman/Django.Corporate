"use client";

import React from 'react';
import { Logo } from '../Logo';
import { Menu } from '../Header/Menu';

export function HeaderSolid() {
    return (
        <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-12 bg-header-s border-b transition-all">
            <Logo />

            <Menu />

            <div className="w-10" />
        </header>
    );
}
