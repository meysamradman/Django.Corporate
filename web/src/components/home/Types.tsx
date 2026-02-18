import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { PropertyType } from "@/types/real-estate/property";
import { realEstateMedia } from "@/core/utils/media";

type TypesProps = {
    types?: PropertyType[];
};

export default function Types({ types = [] }: TypesProps) {
    const items = Array.isArray(types) ? types.slice(0, 4) : [];

    const placeholders = [1, 2, 3, 4];
    const displayItems = items.length === 0 ? placeholders : items;

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                                <Link href={`/properties/type/${encodeURIComponent(type.slug)}`} className="absolute inset-0 z-10" aria-label={`مشاهده ${type.name}`} />
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