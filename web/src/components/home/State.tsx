"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter } from "@/components/elements/Card";
import { realEstateApi } from "@/api/real-estate/route";
import type { PropertyState } from "@/types/real-estate/property";

export default function State() {
  const [states, setStates] = useState<PropertyState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
  const backendBaseUrl = apiBaseUrl.replace(/\/api$/i, '');

  const getStateImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return "/images/profile-banner.png";
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/')) {
      return backendBaseUrl ? `${backendBaseUrl}${imageUrl}` : imageUrl;
    }
    return imageUrl;
  };

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

  useEffect(() => {
    let isMounted = true;

    const loadStates = async () => {
      try {
        const result = await realEstateApi.getStates({ size: 3 });
        if (isMounted) {
          const items = Array.isArray(result?.data) ? result.data : [];
          setStates(items.slice(0, 3));
        }
      } catch {
        if (isMounted) {
          setStates([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStates();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || states.length === 0) {
    return (
      <div className="justify-center grid grid-cols-3 gap-5 bg-bg">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="">
            <CardContent className="">
              <div className="relative h-40 md:h-56">
                <img
                  src="/images/profile-banner.png"
                  alt="Cover image"
                  className="h-full w-full object-cover"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-5">
              <h1 className="">sdsd</h1>
              <p className="">sdsd</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="justify-center grid grid-cols-3 gap-5 bg-bg">
      {states.map((state) => (
        <Card key={state.id} className="">
          <CardContent className="">
            <div className="relative h-40 md:h-56">
              <img
                src={getStateImageUrl(state.image_url)}
                alt={state.name || state.title || 'state'}
                className="h-full w-full object-cover"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-5">
            <h1 className="">{state.name || state.title || '-'}</h1>
            <p className="">{formatUsageType(state.usage_type)}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}