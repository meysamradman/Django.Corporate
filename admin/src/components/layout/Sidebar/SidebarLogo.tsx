'use client';

import { useAuth } from '@/core/auth/AuthContext';
import Image from 'next/image';
import { mediaService } from '@/components/media/services';

export function SidebarLogo() {
  const { panelSettings } = useAuth();

  // Use logo_detail if available, otherwise fallback to logo_url
  const logoPath = panelSettings?.logo_detail?.file_url || panelSettings?.logo_url;
  
  // Use mediaService to properly construct the full URL
  const logoUrl = logoPath ? mediaService.getMediaUrlFromObject({ file_url: logoPath } as any) : null;

  return (
    <div className="h-16 flex items-center justify-center border-b border-sdb-br">
      {logoUrl ? (
        <div className="w-10 h-10 relative overflow-hidden rounded-md">
          <Image
            src={logoUrl}
            alt={panelSettings?.panel_title || 'پنل ادمین'}
            fill
            className="object-cover"
            unoptimized // For dynamic URLs with cache busting
            priority // Load logo quickly
          />
        </div>
      ) : (
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">
            {panelSettings?.panel_title?.charAt(0) || 'A'}
          </span>
        </div>
      )}
    </div>
  );
}