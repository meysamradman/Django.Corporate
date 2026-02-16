"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from "@/components/elements/Card";
import { realEstateApi } from "@/api/real-estate/route";
import type { PropertyState } from "@/types/real-estate/property";

export default function State() {
  const [states, setStates] = useState<PropertyState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStates = async () => {
      try {
        const result = await realEstateApi.getStates({ size: 3 });
        if (isMounted) {
          setStates(result.items.slice(0, 3));
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
                <Image
                  src="/images/profile-banner.png"
                  alt="Cover image"
                  fill
                  className="object-cover"
                  priority
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
              <Image
                src="/images/profile-banner.png"
                alt={state.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-5">
            <h1 className="">{state.name}</h1>
            <p className="">{state.usage_type}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}