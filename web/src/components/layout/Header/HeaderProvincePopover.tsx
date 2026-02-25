"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/elements/dialog";
import { filtersToHref, resolvePropertySearchFilters, toSeoLocationSegment } from "@/components/real-estate/search/filters";
import { cn } from "@/core/utils/cn";
import type { ProvinceCompact } from "@/types/shared/location";

type HeaderProvincePopoverProps = {
  provinceOptions?: ProvinceCompact[];
  variant?: "transparent" | "solid";
};

const TEXT = {
  all: "همه",
  province: "استان",
  chooseProvince: "انتخاب استان",
  allProvinces: "همه استان‌ها",
  close: "بستن",
};

const PREFERRED_PROVINCE_ID_COOKIE = "preferred_province_id";

const getCookieValue = (key: string): string => {
  if (typeof document === "undefined") return "";
  const token = `${key}=`;
  const found = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(token));
  return found ? decodeURIComponent(found.slice(token.length)) : "";
};

const setCookieValue = (key: string, value: string): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
};

const formatCount = (count: number): string => count.toLocaleString("fa-IR");

type SearchParamsLike = {
  get: (name: string) => string | null;
  forEach: (callback: (value: string, key: string) => void) => void;
  toString: () => string;
};

const decodePathPart = (value: string): string => {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
};

const toSearchParamRecord = (searchParams: SearchParamsLike): Record<string, string> => {
  const record: Record<string, string> = {};
  searchParams.forEach((value: string, key: string) => {
    record[key] = value;
  });
  return record;
};

const toProvinceHref = (province: ProvinceCompact, searchParams: SearchParamsLike): string => {
  const currentFilters = resolvePropertySearchFilters(toSearchParamRecord(searchParams));
  const provinceSlug = (province.slug || toSeoLocationSegment(province.name)).trim();

  return filtersToHref(currentFilters, {
    province: province.id,
    province_slug: provinceSlug,
    city: null,
    city_slug: "",
    region: null,
    page: 1,
  });
};

const toAllProvincesHref = (searchParams: SearchParamsLike): string => {
  const currentFilters = resolvePropertySearchFilters(toSearchParamRecord(searchParams));

  return filtersToHref(currentFilters, {
    province: null,
    province_slug: "",
    city: null,
    city_slug: "",
    region: null,
    page: 1,
  });
};

export function HeaderProvincePopover({ provinceOptions = [], variant = "solid" }: HeaderProvincePopoverProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [preferredProvinceId, setPreferredProvinceId] = React.useState<number | null>(null);
  const [preferredAll, setPreferredAll] = React.useState(false);

  React.useEffect(() => {
    const rawCookie = getCookieValue(PREFERRED_PROVINCE_ID_COOKIE);
    if (rawCookie === "all") {
      setPreferredAll(true);
      setPreferredProvinceId(null);
      return;
    }

    const fromCookie = Number(rawCookie);
    if (!Number.isNaN(fromCookie) && fromCookie > 0) {
      setPreferredAll(false);
      setPreferredProvinceId(fromCookie);
    }
  }, []);

  const selectedProvince = React.useMemo(() => {
    const provinceIdRaw = searchParams.get("province");
    if (provinceIdRaw) {
      const provinceId = Number(provinceIdRaw);
      if (!Number.isNaN(provinceId)) {
        const matchedById = provinceOptions.find((item) => item.id === provinceId);
        if (matchedById) {
          return matchedById;
        }
      }
    }

    const provinceSlug = (searchParams.get("province_slug") || "").trim();
    if (provinceSlug) {
      const matchedBySlug = provinceOptions.find((item) => (item.slug || "").trim() === provinceSlug);
      if (matchedBySlug) {
        return matchedBySlug;
      }
    }

    const pathnameParts = pathname.split("/").map((part) => decodePathPart(part)).filter(Boolean);
    const propertiesIndex = pathnameParts.findIndex((part) => part === "properties");

    if (propertiesIndex >= 0) {
      const routeSegments = pathnameParts.slice(propertiesIndex + 1);
      for (const segment of routeSegments) {
        const matchedByPathSlug = provinceOptions.find((item) => (item.slug || "").trim() === segment);
        if (matchedByPathSlug) {
          return matchedByPathSlug;
        }
      }
    }

    if (preferredProvinceId !== null) {
      const matchedByPreferred = provinceOptions.find((item) => item.id === preferredProvinceId);
      if (matchedByPreferred) {
        return matchedByPreferred;
      }
    }

    return null;
  }, [pathname, preferredProvinceId, provinceOptions, searchParams]);

  const triggerLabel = selectedProvince?.name || TEXT.province;

  if (provinceOptions.length === 0) {
    return null;
  }

  const triggerClass = variant === "transparent"
    ? "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-static-w/20 bg-static-w/10 px-3 text-xs font-bold text-static-w transition-colors hover:bg-static-w/15"
    : "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-br bg-bg px-3 text-xs font-bold text-font-p transition-colors hover:bg-card";
  const triggerIconClass = variant === "transparent" ? "size-3.5 text-static-w/90" : "size-3.5 text-font-s";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={triggerClass}
          aria-label={TEXT.chooseProvince}
        >
          <MapPin className={triggerIconClass} />
          <span className="line-clamp-1 max-w-24 sm:max-w-28">{triggerLabel}</span>
          <ChevronDown className={triggerIconClass} />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm border-br bg-card p-0" showCloseButton={false}>
        <DialogHeader className="border-b border-br px-4 py-3 text-right">
          <DialogTitle className="text-sm font-black text-font-p">{TEXT.chooseProvince}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => {
              const href = toAllProvincesHref(searchParams);
              setCookieValue(PREFERRED_PROVINCE_ID_COOKIE, "all");
              setPreferredAll(true);
              setPreferredProvinceId(null);
              setOpen(false);

              if (!pathname.startsWith("/properties")) {
                return;
              }

              const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
              if (currentUrl === href) {
                return;
              }
              router.push(href);
            }}
            className={cn(
              "mb-1 flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-right transition-colors",
              selectedProvince === null ? "border-br bg-bg text-font-p" : "border-transparent bg-transparent text-font-s hover:border-br hover:bg-bg hover:text-font-p"
            )}
          >
            <span className="line-clamp-1 text-sm font-semibold">{TEXT.allProvinces}</span>
          </button>

          {provinceOptions.map((province) => {
            const isActive = selectedProvince?.id === province.id;

            return (
              <button
                key={`province-${province.id}`}
                type="button"
                onClick={() => {
                  const href = toProvinceHref(province, searchParams);
                  setCookieValue(PREFERRED_PROVINCE_ID_COOKIE, String(province.id));
                  setPreferredAll(false);
                  setPreferredProvinceId(province.id);
                  setOpen(false);

                  if (!pathname.startsWith("/properties")) {
                    return;
                  }

                  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
                  if (currentUrl === href) {
                    return;
                  }
                  router.push(href);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-right transition-colors",
                  isActive
                    ? "border-br bg-bg text-font-p"
                    : "border-transparent bg-transparent text-font-s hover:border-br hover:bg-bg hover:text-font-p"
                )}
              >
                <span className="line-clamp-1 text-sm font-semibold">{province.name}</span>
                {typeof province.property_count === "number" ? (
                  <span
                    className={cn(
                      "ms-3 inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-bold",
                      isActive ? "border-br bg-card text-font-p" : "border-br bg-bg text-font-s"
                    )}
                  >
                    {formatCount(province.property_count)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="border-t border-br p-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-br bg-bg px-3 text-xs font-bold text-font-p transition-colors hover:bg-card"
          >
            {TEXT.close}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
