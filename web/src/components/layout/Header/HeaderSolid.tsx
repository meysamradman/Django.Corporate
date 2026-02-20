"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuTypeOption } from './Menu';

type HeaderSolidProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    typeOptions?: HeaderMenuTypeOption[];
};

export function HeaderSolid({ logo = null, isScrolled, typeOptions = [] }: HeaderSolidProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="solid"
            reserveSpaceOnScroll
            typeOptions={typeOptions}
        />
    );
}
