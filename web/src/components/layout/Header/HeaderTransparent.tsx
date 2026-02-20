"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuTypeOption } from './Menu';

type HeaderTransparentProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    typeOptions?: HeaderMenuTypeOption[];
};

export function HeaderTransparent({ logo = null, isScrolled, typeOptions = [] }: HeaderTransparentProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="transparent"
            reserveSpaceOnScroll={false}
            typeOptions={typeOptions}
        />
    );
}
