"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { HeaderTransparent } from './HeaderTransparent';
import { HeaderSolid } from './HeaderSolid';
import type { SiteLogo } from '@/types/settings/branding';
import type { HeaderMenuTypeOption } from './Menu';

/**
 * Main Header Switcher
 * Decides whether to show the Transparent header (Homepage) or Solid header (Internal pages).
 */
type HeaderProps = {
  logo?: SiteLogo | null;
  typeOptions?: HeaderMenuTypeOption[];
};

export function Header({ logo = null, typeOptions = [] }: HeaderProps) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    let frameId = 0;
    const threshold = 140;

    const onScroll = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > threshold);
        frameId = 0;
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (isHomepage) {
    return <HeaderTransparent logo={logo} isScrolled={isScrolled} typeOptions={typeOptions} />;
  }

  return <HeaderSolid logo={logo} isScrolled={isScrolled} typeOptions={typeOptions} />;
}
