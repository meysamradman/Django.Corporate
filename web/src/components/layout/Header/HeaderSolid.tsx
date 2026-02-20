"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuStatusOption } from './Menu';

type HeaderSolidProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    statusOptions?: HeaderMenuStatusOption[];
};

export function HeaderSolid({ logo = null, isScrolled, statusOptions = [] }: HeaderSolidProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="solid"
            reserveSpaceOnScroll
            statusOptions={statusOptions}
        />
    );
}
