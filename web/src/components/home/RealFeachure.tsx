import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from "@/components/elements/Card";
import { Separator } from "@/components/elements/Separator";
import type { Property } from '@/types/real-estate/property';
import { realEstateMedia } from '@/core/utils/media';

type RealFeachureProps = {
    properties?: Property[];
};

export default function RealFeachure({ properties = [] }: RealFeachureProps) {
    const items = Array.isArray(properties) ? properties : [];

    const cards: Array<Property | null> = items.slice(0, 4);
    while (cards.length < 4) cards.push(null);

    const formatPrice = (property: Property): string => {
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

    const getLocation = (property: Property): string => {
        const parts = [property.province_name, property.city_name, property.district_name].filter(Boolean);
        return parts.join('، ') || property.neighborhood || '';
    };

    return (
        <div className=" justify-center grid grid-cols-4 gap-5  bg-bg">

            {cards.map((property, index) => {
                const hasData = Boolean(property?.id);
                const imageSrc = realEstateMedia.getPropertyMainImage(property?.main_image || null);
                const title = hasData && property ? property.title : '';
                const sub = hasData && property ? (getLocation(property) || property.short_description || '') : '';
                const footerLeft = hasData && property ? formatPrice(property) : '';
                const footerRight = hasData && property ? (property.property_type?.name || property.state?.name || '') : '';

                return (
                    <Card key={hasData && property ? String(property.id) : `placeholder-${index}`} className="p-0 gap-0">

                        <div className="relative h-40 md:h-56">
                            <Image
                                src={imageSrc}
                                alt={hasData && property ? (property.main_image?.alt_text || property.title) : 'Cover image'}
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