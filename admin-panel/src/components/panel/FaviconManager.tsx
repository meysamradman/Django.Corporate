import { usePanelSettings } from '@/components/panel/hooks/usePanelSettings';
import { mediaService } from '@/components/media/services';
import { useEffect, useRef, useMemo } from 'react';

let cachedLinkElement: HTMLLinkElement | null = null;

const getOrCreateLinkElement = (): HTMLLinkElement => {
  if (cachedLinkElement && document.head.contains(cachedLinkElement)) {
    return cachedLinkElement;
  }
  
  let linkElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  
  if (!linkElement) {
    linkElement = document.createElement('link');
    linkElement.rel = 'icon';
    document.head.appendChild(linkElement);
  }
  
  cachedLinkElement = linkElement;
  return linkElement;
};

const getFaviconType = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'ico':
      return 'image/x-icon';
    default:
      return 'image/png';
  }
};

export function FaviconManager() {
  const { data: panelSettings } = usePanelSettings();
  const previousFaviconUrlRef = useRef<string | null>(null);

  const faviconData = useMemo(() => {
    const faviconPath = panelSettings?.favicon_detail?.file_url || panelSettings?.favicon_url;
    
    if (!faviconPath) {
      return {
        url: '/images/logo/webtalik-favicon.svg',
        type: 'image/svg+xml',
        path: null
      };
    }
    
    const faviconUrl = mediaService.getMediaUrlFromObject({ file_url: faviconPath } as any);
    const faviconType = getFaviconType(faviconPath);
    
    return {
      url: faviconUrl,
      type: faviconType,
      path: faviconPath
    };
  }, [panelSettings?.favicon_detail?.file_url, panelSettings?.favicon_url]);

  useEffect(() => {
    if (previousFaviconUrlRef.current === faviconData.url) {
      return;
    }

    const linkElement = getOrCreateLinkElement();
    
    if (linkElement.href !== faviconData.url) {
      linkElement.href = faviconData.url;
      linkElement.type = faviconData.type;
    }

    try {
      const savedUrl = localStorage.getItem('panel_favicon_url');
      if (savedUrl !== faviconData.url) {
        localStorage.setItem('panel_favicon_url', faviconData.url);
        localStorage.setItem('panel_favicon_type', faviconData.type);
      }
    } catch (e) {}

    previousFaviconUrlRef.current = faviconData.url;
  }, [faviconData.url, faviconData.type]);

  return null;
}

