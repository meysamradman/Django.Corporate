"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuStatusOption, HeaderMenuTypeOption } from './Menu';
import type { ProvinceCompact } from '@/types/shared/location';

type HeaderSolidProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    statusOptions?: HeaderMenuStatusOption[];
    typeOptions?: HeaderMenuTypeOption[];
    provinceOptions?: ProvinceCompact[];
};

export function HeaderSolid({ logo = null, isScrolled, statusOptions = [], typeOptions = [], provinceOptions = [] }: HeaderSolidProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="solid"
            reserveSpaceOnScroll
            statusOptions={statusOptions}
            typeOptions={typeOptions}
            provinceOptions={provinceOptions}
        />
    );
}
