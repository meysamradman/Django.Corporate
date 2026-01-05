"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { HeaderTransparent } from './HeaderTransparent';
import { HeaderSolid } from './HeaderSolid';

/**
 * Main Header Switcher
 * Decides whether to show the Transparent header (Homepage) or Solid header (Internal pages).
 */
export function Header() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  if (isHomepage) {
    return <HeaderTransparent />;
  }

  return <HeaderSolid />;
}
