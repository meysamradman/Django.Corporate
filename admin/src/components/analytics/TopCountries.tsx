"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { formatNumber } from "@/core/utils/format";
import { Skeleton } from "@/components/elements/Skeleton";

interface TopCountry {
  country: string;
  count: number;
}

interface TopCountriesProps {
  topCountries?: TopCountry[];
  isLoading?: boolean;
}

export function TopCountries({ topCountries = [], isLoading }: TopCountriesProps) {
  if (isLoading) {
    return (
      <Card className="border-b-4 border-b-green-1">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topCountries || topCountries.length === 0) {
    return (
      <Card className="border-b-4 border-b-green-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-green-1" />
            کشورهای پربازدید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-font-s text-sm">
            داده‌ای برای نمایش وجود ندارد
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-b-4 border-b-green-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-green-1" />
          کشورهای پربازدید
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topCountries.slice(0, 5).map((country, index) => (
            <div key={index} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-bg transition-colors">
              <span className="text-font-s truncate flex-1 text-left ml-2">
                {country.country || 'نامشخص'}
              </span>
              <span className="text-font-p font-medium">
                {formatNumber(country.count)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

