"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { HeaderTransparent } from './HeaderTransparent';
import { HeaderSolid } from './HeaderSolid';
import type { SiteLogo } from '@/types/settings/branding';

/**
 * Main Header Switcher
 * Decides whether to show the Transparent header (Homepage) or Solid header (Internal pages).
 */
type HeaderProps = {
  logo?: SiteLogo | null;
};

export function Header({ logo = null }: HeaderProps) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  if (isHomepage) {
    return <HeaderTransparent logo={logo} />;
  }

  return <HeaderSolid logo={logo} />;
}
