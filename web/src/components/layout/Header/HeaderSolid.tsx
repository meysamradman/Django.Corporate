"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuStatusOption } from './Menu';
import type { ProvinceCompact } from '@/types/shared/location';

type HeaderSolidProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    statusOptions?: HeaderMenuStatusOption[];
    provinceOptions?: ProvinceCompact[];
};

export function HeaderSolid({ logo = null, isScrolled, statusOptions = [], provinceOptions = [] }: HeaderSolidProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="solid"
            reserveSpaceOnScroll
            statusOptions={statusOptions}
            provinceOptions={provinceOptions}
        />
    );
}
