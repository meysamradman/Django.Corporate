import React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home } from 'lucide-react'; // Placeholder icon for logo
import { brandingApi } from '@/api/settings/branding';
import { env } from '@/core/config/environment';
import type { SiteLogo } from '@/types/settings/branding';

const resolveMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return new URL(url, env.API_BASE_URL).toString();
};

export function Logo() {
    const [data, setData] = useState<SiteLogo | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadLogo = async () => {
            try {
                const result = await brandingApi.getLogo();
                if (isMounted) {
                    setData(result);
                }
            } catch {
            }
        };

        loadLogo();

        return () => {
            isMounted = false;
        };
    }, []);

    const logoUrl = resolveMediaUrl(data?.logo_url);

    return (
        <Link href="/" className="flex items-center gap-2 group">
            {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={logoUrl}
                    alt={data?.site_name || 'Logo'}
                    className="h-10 w-auto max-w-40 object-contain transition-transform group-hover:scale-105"
                />
            ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-105">
                    <Home size={24} />
                </div>
            )}
        </Link>
    );
}
