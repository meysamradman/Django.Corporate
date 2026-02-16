"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { realEstateApi } from "@/api/real-estate/route";
import type { PropertyType } from "@/types/real-estate/property";
import { realEstateMedia } from "@/core/utils/media";

export default function Types() {
    const [types, setTypes] = useState<PropertyType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadTypes = async () => {
            try {
                const result = await realEstateApi.getTypes({ size: 4 });
                if (!isMounted) return;

                const items = Array.isArray(result?.data) ? result.data : [];
                setTypes(items.slice(0, 4));
            } catch (error) {
                console.error('Error loading types:', error);
                if (isMounted) setTypes([]);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadTypes();

        return () => {
            isMounted = false;
        };
    }, []);

    const placeholders = [1, 2, 3, 4];
    const displayItems = isLoading || types.length === 0 ? placeholders : types;

    return (
        <div className=" justify-center grid grid-cols-4 gap-5  bg-bg">
            {displayItems.map((item, idx) => {
                const type = typeof item === 'number' ? null : item;
                const src = type
                    ? realEstateMedia.getTypeImage(type.image_url ?? null, '/images/profile-banner.png')
                    : '/images/profile-banner.png';

                return (
                    <div key={type?.id ?? idx} className="relative h-150">
                        <Image
                            src={src}
                            alt={type?.name || 'Cover image'}
                            fill
                            className="object-cover"
                            priority
                        />

                        {type ? (
                            <div className="absolute inset-0">
                                <div className="absolute inset-0 bg-black/25" />

                                <div className="absolute top-4 right-4 text-white text-right">
                                    <p className="text-xs opacity-90">املاک</p>
                                    <p className="text-xl font-bold leading-tight">{type.name}</p>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                                    <ChevronLeft className="w-5 h-5 text-white stroke-[1px]" />
                                    <span className="text-sm">مشاهده</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}