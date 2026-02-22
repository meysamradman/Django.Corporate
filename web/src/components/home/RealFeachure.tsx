import React from 'react';
import { PropertyCardSquare } from "@/components/real-estate/cards";
import type { Property } from '@/types/real-estate/property';

type RealFeachureProps = {
    properties?: Property[];
};

export default function RealFeachure({ properties = [] }: RealFeachureProps) {
    const items = Array.isArray(properties) ? properties : [];

    const cards: Array<Property | null> = items.slice(0, 4);
    while (cards.length < 4) cards.push(null);

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {cards.map((property, index) => {
                if (!property?.id) {
                    return (
                        <div key={`placeholder-${index}`} className="h-[198px] rounded-xl border border-br bg-card" />
                    );
                }

                return (
                    <PropertyCardSquare
                        key={`property-v1-${property.id}`}
                        property={property}
                        priority={index === 0}
                    />
                );
            })}

        </div>
    );
}