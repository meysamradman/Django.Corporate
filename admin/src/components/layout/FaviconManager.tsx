'use client';

import { useAuth } from '@/core/auth/AuthContext';
import { useEffect } from 'react';
import { mediaService } from '@/components/media/services';

export function FaviconManager() {
  const { panelSettings } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(favicon => favicon.remove());
      
      const faviconPath = panelSettings?.favicon_detail?.file_url || panelSettings?.favicon_url;
      
      const faviconUrl = faviconPath ? mediaService.getMediaUrlFromObject({ file_url: faviconPath } as any) : null;
      
      if (faviconUrl) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = faviconUrl;
        document.head.appendChild(favicon);
      }
      
      if (panelSettings?.panel_title) {
        document.title = panelSettings.panel_title;
      }
    }
  }, [panelSettings?.favicon_detail?.file_url, panelSettings?.favicon_url, panelSettings?.panel_title]);

  return null;
}