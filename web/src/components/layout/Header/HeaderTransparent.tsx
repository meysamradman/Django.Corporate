"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuStatusOption } from './Menu';

type HeaderTransparentProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    statusOptions?: HeaderMenuStatusOption[];
};

export function HeaderTransparent({ logo = null, isScrolled, statusOptions = [] }: HeaderTransparentProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="transparent"
            reserveSpaceOnScroll={false}
            statusOptions={statusOptions}
        />
    );
}
