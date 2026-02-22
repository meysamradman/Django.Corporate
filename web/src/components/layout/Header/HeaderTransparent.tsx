"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuStatusOption } from './Menu';
import type { ProvinceCompact } from '@/types/shared/location';

type HeaderTransparentProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    statusOptions?: HeaderMenuStatusOption[];
    provinceOptions?: ProvinceCompact[];
};

export function HeaderTransparent({ logo = null, isScrolled, statusOptions = [], provinceOptions = [] }: HeaderTransparentProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="transparent"
            reserveSpaceOnScroll={false}
            statusOptions={statusOptions}
            provinceOptions={provinceOptions}
        />
    );
}
