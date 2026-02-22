"use client";

import React from 'react';
import type { SiteLogo } from '@/types/settings/branding';
import { HeaderShell } from './HeaderShell';
import type { HeaderMenuStatusOption, HeaderMenuTypeOption } from './Menu';
import type { ProvinceCompact } from '@/types/shared/location';

type HeaderTransparentProps = {
    logo?: SiteLogo | null;
    isScrolled: boolean;
    statusOptions?: HeaderMenuStatusOption[];
    typeOptions?: HeaderMenuTypeOption[];
    provinceOptions?: ProvinceCompact[];
};

export function HeaderTransparent({ logo = null, isScrolled, statusOptions = [], typeOptions = [], provinceOptions = [] }: HeaderTransparentProps) {
    return (
        <HeaderShell
            logo={logo}
            isScrolled={isScrolled}
            initialMode="transparent"
            reserveSpaceOnScroll={false}
            statusOptions={statusOptions}
            typeOptions={typeOptions}
            provinceOptions={provinceOptions}
        />
    );
}
