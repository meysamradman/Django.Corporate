"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/core/utils/cn';
import { Logo } from '../Logo';
import { Menu, type HeaderMenuStatusOption } from './Menu';
import { DarkMode } from '@/components/theme/DarkMode';
import type { SiteLogo } from '@/types/settings/branding';

type HeaderShellProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    initialMode: 'transparent' | 'solid';
    reserveSpaceOnScroll?: boolean;
    statusOptions?: HeaderMenuStatusOption[];
};

export function HeaderShell({
    logo = null,
    isScrolled,
    initialMode,
    reserveSpaceOnScroll = false,
    statusOptions = [],
}: HeaderShellProps) {
    const isTransparentInitial = initialMode === 'transparent';

    return (
        <>
            {reserveSpaceOnScroll ? (
                <div className={cn('transition-[height] duration-200 ease-out', isScrolled ? 'h-16' : 'h-0')} />
            ) : null}

            <header
                className={cn(
                    'left-0 right-0 z-50 grid grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-12 border-b transition-[height,background-color,border-color,box-shadow] duration-200 ease-out',
                    isScrolled
                        ? 'fixed top-0 h-16 bg-header-s shadow-sm'
                        : isTransparentInitial
                            ? 'absolute top-0 h-20 bg-transparent border-transparent'
                            : 'relative h-20 bg-header-s'
                )}
            >
                <div className="justify-self-start">
                    <Logo data={logo} />
                </div>

                <Menu
                    variant={isScrolled || !isTransparentInitial ? 'solid' : 'transparent'}
                    statusOptions={statusOptions}
                />

                <div className="justify-self-end flex items-center gap-2">
                    <DarkMode />
                    <Link
                        href="/contact"
                        className="hidden sm:inline-flex h-9 items-center rounded-lg border border-br bg-bg px-3 text-xs font-black text-font-p transition-colors hover:bg-card"
                    >
                        مشاوره
                    </Link>
                </div>
            </header>
        </>
    );
}
