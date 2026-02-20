import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from "@/components/elements/card";
import type { PropertyState } from "@/types/real-estate/property";
import { realEstateMedia } from "@/core/utils/media";

type StateProps = {
  states?: PropertyState[];
};

export default function State({ states = [] }: StateProps) {
  const formatUsageType = (usageType?: string) => {
    switch ((usageType || '').toLowerCase()) {
      case 'sale':
        return 'فروش';
      case 'rent':
        return 'اجاره';
      case 'mortgage':
        return 'رهن';
      case 'presale':
        return 'پیش‌فروش';
      case 'exchange':
        return 'معاوضه';
      default:
        return usageType || '-';
    }
  };

  const items = Array.isArray(states) ? states.slice(0, 3) : [];

  if (items.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="">
            <CardContent className="">
              <div className="relative h-40 md:h-56 bg-gray-200 animate-pulse"></div>
            </CardContent>
            <CardFooter className="flex flex-col items-center text-center gap-5">
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((state) => (
        <Link key={state.id} href={`/properties?state_slug=${encodeURIComponent(state.slug)}`}>
          <Card className="">
            <CardContent className="">
              <div className="relative h-40 md:h-56">
                <img
                  src={realEstateMedia.getStateImage(state.image_url)}
                  alt={state.name || state.title || 'state'}
                  className="h-full w-full object-cover"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-center text-center gap-5">
              <h3 className="">{state.name || state.title || '-'}</h3>
              <p className="">{formatUsageType(state.usage_type)}</p>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}