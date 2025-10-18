'use client';

import { useAuth } from '@/core/auth/AuthContext';
import { useEffect } from 'react';
import { mediaService } from '@/components/media/services';

export function FaviconManager() {
  const { panelSettings } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove all existing favicon tags
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(favicon => favicon.remove());
      
      // Use favicon_detail if available, otherwise fallback to favicon_url
      const faviconPath = panelSettings?.favicon_detail?.file_url || panelSettings?.favicon_url;
      
      // Use mediaService to properly construct the full URL
      const faviconUrl = faviconPath ? mediaService.getMediaUrlFromObject({ file_url: faviconPath } as any) : null;
      
      if (faviconUrl) {
        // Create new favicon link
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = faviconUrl;
        document.head.appendChild(favicon);
      }
      // If no faviconUrl, we don't add any favicon which will show the browser's default
      
      // Update title
      if (panelSettings?.panel_title) {
        document.title = panelSettings.panel_title;
      }
    }
  }, [panelSettings?.favicon_detail?.file_url, panelSettings?.favicon_url, panelSettings?.panel_title]);

  return null; // This component doesn't render anything
}