"use client";

import React from 'react';
import { Logo } from '../Logo';
import {Menu} from "@/components/layout/Header/Menu";

export function HeaderTransparent() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 lg:px-12 bg-header-t transition-all duration-300">
            <Logo />

            <Menu />

            <div className="w-10" />
        </header>
    );
}
