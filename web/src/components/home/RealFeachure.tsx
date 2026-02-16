"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from "@/components/elements/Card";
import { Separator } from "@/components/elements/Separator";
import { realEstateApi } from '@/api/real-estate/route';
import type { Property } from '@/types/real-estate/property';
import { realEstateMedia } from '@/core/utils/media';

export default function RealFeachure() {
    const [items, setItems] = useState<Property[]>([]);

    useEffect(() => {
        let mounted = true;
        realEstateApi
            .getFeaturedProperties(4)
            .then((data) => {
                if (!mounted) return;
                setItems(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!mounted) return;
                setItems([]);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const cards = useMemo<Array<Property | null>>(() => {
        const slice: Array<Property | null> = items.slice(0, 4);
        while (slice.length < 4) slice.push(null);
        return slice;
    }, [items]);

    const formatPrice = (property?: Property | null): string => {
        if (!property) return '';
        const value =
            property.sale_price ??
            property.price ??
            property.monthly_rent ??
            property.mortgage_amount ??
            null;

        if (value === null || value === undefined) return '';
        try {
            return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
        } catch {
            return `${value} تومان`;
        }
    };

    const getLocation = (property?: Property | null): string => {
        if (!property) return '';
        const parts = [property.province_name, property.city_name, property.district_name].filter(Boolean);
        return parts.join('، ') || property.neighborhood || '';
    };

    return (
        <div className=" justify-center grid grid-cols-4 gap-5  bg-bg">

            {cards.map((property, index) => {
                const hasData = Boolean(property?.id);
                const imageSrc = realEstateMedia.getPropertyMainImage(property?.main_image || null);
                const title = hasData ? property.title : '';
                const sub = hasData ? (getLocation(property) || property.short_description || '') : '';
                const footerLeft = hasData ? formatPrice(property) : '';
                const footerRight = hasData ? (property.property_type?.name || property.state?.name || '') : '';

                return (
                    <Card key={hasData ? String(property!.id) : `placeholder-${index}`} className="p-0 gap-0">

                        <div className="relative h-40 md:h-56">
                            <Image
                                src={imageSrc}
                                alt={hasData ? (property.main_image?.alt_text || property.title) : 'Cover image'}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                        </div>


                        <CardContent className="p-5">
                            <h1 className="">{title}</h1>
                            <p className="">{sub}</p>
                        </CardContent>
                        <Separator></Separator>
                        <CardFooter className="flex justify-between gap-5 p-5">
                            <h1 className="">{footerLeft}</h1>
                            <p className="">{footerRight}</p>
                        </CardFooter>

                    </Card>
                );
            })}

        </div>
    );
}