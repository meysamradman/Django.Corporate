import { MapPin } from "lucide-react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { formatNumber } from "@/core/utils/commonFormat";
import { Skeleton } from "@/components/elements/Skeleton";
import { getCountryFlag } from "@/core/utils/countryFlags";

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
      <CardWithIcon
        icon={MapPin}
        title="کشورهای پربازدید"
        iconBgColor="bg-green"
        iconColor="stroke-green-2"
        cardBorderColor="border-b-green-1"
      >
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardWithIcon>
    );
  }

  if (!topCountries || topCountries.length === 0) {
    return (
      <CardWithIcon
        icon={MapPin}
        title="کشورهای پربازدید"
        iconBgColor="bg-green"
        iconColor="stroke-green-2"
        cardBorderColor="border-b-green-1"
      >
        <div className="text-center py-4 text-font-s text-sm">
          داده‌ای برای نمایش وجود ندارد
        </div>
      </CardWithIcon>
    );
  }

  const total = topCountries.reduce((sum, c) => sum + c.count, 0);

  return (
    <CardWithIcon
      icon={MapPin}
      title="کشورهای پربازدید"
      iconBgColor="bg-green"
      iconColor="stroke-green-2"
      cardBorderColor="border-b-green-1"
      titleExtra={<span className="text-xs text-font-s">{topCountries.length} کشور</span>}
      contentClassName="max-h-[340px] overflow-y-auto scrollbar-thick"
    >
      <div className="space-y-2">
        {topCountries.map((country, index) => {
          const countryName = country.country || 'نامشخص';
          const flag = getCountryFlag(countryName);
          const percentage = total > 0 ? ((country.count / total) * 100).toFixed(1) : '0';

          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border border-br bg-bg/30 transition-colors"
            >
              <div className="flex-shrink-0 text-2xl" title={countryName}>
                {flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-medium text-font-p truncate">
                    {countryName}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-font-s">({percentage}%)</span>
                    <span className="text-sm font-bold text-font-p">
                      {formatNumber(country.count)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-1 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CardWithIcon>
  );
}

