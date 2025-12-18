import { useAuth } from '@/core/auth/AuthContext';
import { mediaService } from '@/components/media/services';
import { useState, useEffect } from 'react';

export function SidebarLogo() {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const panelSettings = (user as any)?.panel_settings || null;
  const panelTitle = panelSettings?.panel_title || 'پنل ادمین';

  useEffect(() => {
    const logoPath = panelSettings?.logo_detail?.file_url || panelSettings?.logo_url;
    const url = logoPath ? mediaService.getMediaUrlFromObject({ file_url: logoPath } as any) : null;
    setLogoUrl(url);
  }, [panelSettings?.logo_detail?.file_url, panelSettings?.logo_url]);

  return (
    <div className="h-16 flex items-center justify-center border-b">
      {logoUrl ? (
        <div className="w-10 h-10 relative overflow-hidden rounded-md">
          <img
            src={logoUrl}
            alt={panelTitle}
            className="object-cover w-full h-full"
            loading="eager"
          />
        </div>
      ) : (
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-static-w font-bold text-sm">
            {panelTitle.charAt(0) || 'A'}
          </span>
        </div>
      )}
    </div>
  );
}

