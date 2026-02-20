"use client";

import React from 'react';
import { cn } from '@/core/utils/cn';
import { Logo } from '../Logo';
import { Menu, type HeaderMenuStatusOption } from './Menu';
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
                    'left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 border-b transition-[height,background-color,border-color,box-shadow] duration-200 ease-out',
                    isScrolled
                        ? 'fixed top-0 h-16 bg-header-s shadow-sm'
                        : isTransparentInitial
                            ? 'absolute top-0 h-20 bg-transparent border-transparent'
                            : 'relative h-20 bg-header-s'
                )}
            >
                <Logo data={logo} />

                <Menu
                    variant={isScrolled || !isTransparentInitial ? 'solid' : 'transparent'}
                    statusOptions={statusOptions}
                />

                <div className="w-10" />
            </header>
        </>
    );
}
