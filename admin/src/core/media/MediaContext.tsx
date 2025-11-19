'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { usePathname, useParams } from 'next/navigation';

type MediaContextType = 'media_library' | 'portfolio' | 'blog';

interface MediaContextValue {
  context: MediaContextType;
  contextId?: number | string;
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined);

interface MediaContextProviderProps {
  children: ReactNode;
  overrideContext?: MediaContextType;
  overrideContextId?: number | string;
}

/**
 * ✅ Provider که یک بار context رو تشخیص می‌ده و در همه کامپوننت‌ها share می‌کنه
 * این روش خیلی بهینه‌تر از صدا زدن usePathname در هر کامپوننت است
 */
export function MediaContextProvider({ 
  children, 
  overrideContext, 
  overrideContextId 
}: MediaContextProviderProps) {
  const pathname = usePathname();
  const params = useParams();

  const value = useMemo<MediaContextValue>(() => {
    // اگر override شده، از همون استفاده کن
    if (overrideContext) {
      return {
        context: overrideContext,
        contextId: overrideContextId,
      };
    }

    // تشخیص context از pathname
    if (!pathname) {
      return { context: 'media_library' };
    }

    // Portfolio routes
    if (pathname.includes('/portfolios')) {
      const id = params?.id as string | undefined;
      return {
        context: 'portfolio',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    // Blog routes
    if (pathname.includes('/blogs')) {
      const id = params?.id as string | undefined;
      return {
        context: 'blog',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    // Default: media_library
    return { context: 'media_library' };
  }, [pathname, params, overrideContext, overrideContextId]);

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
}

/**
 * ✅ Hook برای استفاده از media context
 * اگر Provider استفاده نشده باشد، خودش تشخیص می‌دهد (fallback)
 */
export function useMediaContext(
  overrideContext?: MediaContextType,
  overrideContextId?: number | string
): MediaContextValue {
  const contextValue = useContext(MediaContext);
  
  // اگر Provider استفاده شده، از همون استفاده کن
  if (contextValue !== undefined) {
    // اگر override شده، override کن
    if (overrideContext) {
      return {
        context: overrideContext,
        contextId: overrideContextId,
      };
    }
    return contextValue;
  }

  // Fallback: اگر Provider استفاده نشده، خودش تشخیص بده
  // این برای مواردی است که نمی‌خواهیم Provider اضافه کنیم
  const pathname = usePathname();
  const params = useParams();

  return useMemo<MediaContextValue>(() => {
    if (overrideContext) {
      return {
        context: overrideContext,
        contextId: overrideContextId,
      };
    }

    if (!pathname) {
      return { context: 'media_library' };
    }

    if (pathname.includes('/portfolios')) {
      const id = params?.id as string | undefined;
      return {
        context: 'portfolio',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    if (pathname.includes('/blogs')) {
      const id = params?.id as string | undefined;
      return {
        context: 'blog',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    return { context: 'media_library' };
  }, [pathname, params, overrideContext, overrideContextId]);
}

