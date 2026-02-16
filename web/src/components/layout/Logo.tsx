import React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Home } from 'lucide-react'; // Placeholder icon for logo
import { brandingApi } from '@/api/settings/branding';
import type { SiteLogo } from '@/types/settings/branding';

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

    return (
        <Link href="/" className="flex items-center gap-2 group">
            {data?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={data.logo_url}
                    alt={data.site_name || 'Logo'}
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
