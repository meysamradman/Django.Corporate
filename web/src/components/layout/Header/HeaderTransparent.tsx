"use client";

import React from 'react';
import { Logo } from '../Logo';
import {Menu} from "@/components/layout/Header/Menu";
import type { SiteLogo } from '@/types/settings/branding';

type HeaderTransparentProps = {
    logo?: SiteLogo | null;
};

export function HeaderTransparent({ logo = null }: HeaderTransparentProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 lg:px-12 bg-header-t transition-all duration-300">
            <Logo data={logo} />

            <Menu />

            <div className="w-10" />
        </header>
    );
}
