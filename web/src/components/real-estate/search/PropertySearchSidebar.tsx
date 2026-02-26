"use client";

import React from "react";
import { realEstateApi } from "@/api/real-estate/route";
import { Button } from "@/components/elements/custom/button";
import { Input } from "@/components/elements/input";
import { PopupPicker } from "@/components/elements/popup-picker";
import { Separator } from "@/components/elements/separator";
import { Switch } from "@/components/elements/switch";
import { fromSortValue, toSeoLocationSegment, toSortValue } from "@/components/real-estate/search/filters";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

export type SidebarOption = {
  id: number;
  value: string;
  title: string;
  slug?: string;
  provinceId?: number;
  cityId?: number;
};

type PropertySearchSidebarProps = {
  filters: PropertySearchFilters;
  isLoading?: boolean;
  typeOptions: SidebarOption[];
  stateOptions: SidebarOption[];
  provinceOptions: SidebarOption[];
  cityOptions: SidebarOption[];
  regionOptions: SidebarOption[];
  tagOptions: SidebarOption[];
  featureOptions: SidebarOption[];
  statusOptions: SidebarOption[];
  onFiltersChange: (updates: Partial<PropertySearchFilters>) => void;
  onReset: () => void;
};

const sectionClassName = "space-y-3";
const YEAR_BUILT_MIN = 1300;
const YEAR_BUILT_MAX = 1550;
const YEAR_BUILT_OPTIONS = [
  { value: "", title: "همه سال‌ها" },
  ...Array.from({ length: YEAR_BUILT_MAX - YEAR_BUILT_MIN + 1 }, (_, index) => {
    const year = String(YEAR_BUILT_MAX - index);
    return { value: year, title: year };
  }),
];

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim().replace(/,/g, "");

  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
};

function BinarySwitch({
  value,
  onChange,
  label,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  label: string;
}) {
  const checked = value === true;

  return (
    <div className="flex items-center justify-between rounded-md border border-br bg-wt px-3 py-2">
      <span className="text-sm text-font-s">{label}</span>
      <Switch checked={checked} onCheckedChange={(nextChecked) => onChange(nextChecked ? true : null)} aria-label={label} />
    </div>
  );
}

export default function PropertySearchSidebar({
  filters,
  isLoading = false,
  typeOptions,
  stateOptions,
  provinceOptions,
  cityOptions,
  regionOptions,
  onFiltersChange,
  onReset,
}: PropertySearchSidebarProps) {
  const [dynamicCityOptions, setDynamicCityOptions] = React.useState<SidebarOption[]>(cityOptions);
  const [dynamicRegionOptions, setDynamicRegionOptions] = React.useState<SidebarOption[]>(regionOptions);

  React.useEffect(() => {
    setDynamicCityOptions(cityOptions);
  }, [cityOptions]);

  React.useEffect(() => {
    setDynamicRegionOptions(regionOptions);
  }, [regionOptions]);

  React.useEffect(() => {
    let ignore = false;

    if (filters.province === null) {
      setDynamicCityOptions(cityOptions);
      return () => {
        ignore = true;
      };
    }

    realEstateApi
      .getCities({ province_id: filters.province, page: 1, size: 500 })
      .then((response) => {
        if (ignore) return;
        const nextOptions = (response?.data ?? []).map((item) => ({
          id: item.id,
          value: String(item.id),
          title: item.name,
          slug: item.slug,
          provinceId: item.province_id,
        }));
        setDynamicCityOptions(nextOptions);
      })
      .catch(() => {
        if (ignore) return;
        setDynamicCityOptions([]);
      });

    return () => {
      ignore = true;
    };
  }, [filters.province, cityOptions]);

  React.useEffect(() => {
    let ignore = false;

    if (filters.city === null) {
      setDynamicRegionOptions([]);
      return () => {
        ignore = true;
      };
    }

    realEstateApi
      .getRegions({ city_id: filters.city, page: 1, size: 500 })
      .then((response) => {
        if (ignore) return;
        const nextOptions = (response?.data ?? []).map((item) => ({
          id: item.id,
          value: String(item.id),
          title: item.name,
          cityId: item.city_id,
        }));
        setDynamicRegionOptions(nextOptions);
      })
      .catch(() => {
        if (ignore) return;
        setDynamicRegionOptions([]);
      });

    return () => {
      ignore = true;
    };
  }, [filters.city, regionOptions]);

  const sortValue = toSortValue(filters);
  const selectedTypeValue =
    filters.property_type !== null
      ? String(filters.property_type)
      : typeOptions.find((item) => item.slug === filters.type_slug)?.value || "";
  const selectedStateValue =
    filters.state !== null
      ? String(filters.state)
      : stateOptions.find((item) => item.slug === filters.state_slug)?.value || "";
  const selectedProvinceValue = filters.province !== null ? String(filters.province) : "";
  const availableCityOptions =
    filters.province !== null
      ? dynamicCityOptions.filter((item) => item.provinceId === filters.province)
      : dynamicCityOptions;
  const selectedCityValue =
    filters.city !== null && availableCityOptions.some((item) => item.value === String(filters.city))
      ? String(filters.city)
      : "";
  const availableRegionOptions =
    filters.city !== null
      ? dynamicRegionOptions.filter((item) => item.cityId === filters.city)
      : [];
  const selectedRegionValue =
    filters.region !== null && availableRegionOptions.some((item) => item.value === String(filters.region))
      ? String(filters.region)
      : "";

  const update = (updates: Partial<PropertySearchFilters>) => {
    onFiltersChange({ ...updates, page: 1 });
  };

  return (
    <aside className="rounded-2xl border border-br bg-card p-4 md:p-5 space-y-5 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto">
      <div className="flex items-center">
        <h2 className="text-base font-black text-font-p">فیلترهای جستجو</h2>
      </div>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <div className="space-y-2">
          <label className="text-sm text-font-s">عبارت جستجو</label>
          <Input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="عنوان، توضیحات، محله..."
          />
        </div>
        <p className="text-xs text-font-s">با تایپ، نتایج به‌صورت خودکار بروزرسانی می‌شود.</p>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">نوع و معامله</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">نوع ملک</label>
          <PopupPicker
            value={selectedTypeValue}
            title="انتخاب نوع ملک"
            placeholder="همه"
            searchable
            searchPlaceholder="جستجوی نوع ملک"
            options={[
              { value: "", title: "همه" },
              ...typeOptions.map((item) => ({ value: item.value, title: item.title })),
            ]}
            onSelect={(value) => {
              const selected = typeOptions.find((item) => item.value === value);
              const nextTypeSlug = selected?.slug || "";
              const nextTypeId = toNumberOrNull(value);
              update({
                property_type: nextTypeId,
                type_slug: nextTypeSlug,
              });
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-font-s">نوع معامله</label>
          <PopupPicker
            value={selectedStateValue}
            title="انتخاب نوع معامله"
            placeholder="همه"
            searchable
            searchPlaceholder="جستجوی نوع معامله"
            options={[
              { value: "", title: "همه" },
              ...stateOptions.map((item) => ({ value: item.value, title: item.title })),
            ]}
            onSelect={(value) => {
              const selected = stateOptions.find((item) => item.value === value);
              update({
                state: toNumberOrNull(value),
                state_slug: selected?.slug || "",
              });
            }}
          />
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">موقعیت</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">استان</label>
            <PopupPicker
              value={selectedProvinceValue}
              title="انتخاب استان"
              placeholder="همه استان‌ها"
              searchable
              searchPlaceholder="جستجوی استان"
              options={[
                { value: "", title: "همه استان‌ها" },
                ...provinceOptions.map((item) => ({ value: item.value, title: item.title })),
              ]}
              onSelect={(value) => {
                const provinceValue = toNumberOrNull(value);
                const selectedProvince = provinceOptions.find((item) => item.value === value);
                update({
                  province: provinceValue,
                  city: null,
                  region: null,
                  province_slug: selectedProvince?.slug || (selectedProvince?.title ? toSeoLocationSegment(selectedProvince.title) : ""),
                  city_slug: "",
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">شهر</label>
            <PopupPicker
              value={selectedCityValue}
              title="انتخاب شهر"
              placeholder="همه شهرها"
              searchable
              searchPlaceholder="جستجوی شهر"
              options={[
                { value: "", title: "همه شهرها" },
                ...availableCityOptions.map((item) => ({ value: item.value, title: item.title })),
              ]}
              onSelect={(value) => {
                const cityId = toNumberOrNull(value);
                const selectedCity = availableCityOptions.find((item) => item.value === value);
                update({
                  city: cityId,
                  region: null,
                  city_slug: selectedCity?.slug || (selectedCity?.title ? toSeoLocationSegment(selectedCity.title) : ""),
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">منطقه</label>
            <PopupPicker
              value={selectedRegionValue}
              title="انتخاب منطقه"
              placeholder="همه مناطق"
              searchable
              searchPlaceholder="جستجوی منطقه"
              options={[
                { value: "", title: "همه مناطق" },
                ...availableRegionOptions.map((item) => ({ value: item.value, title: item.title })),
              ]}
              onSelect={(value) => update({ region: toNumberOrNull(value) })}
              disabled={filters.city === null}
            />
          </div>
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">متراژ (متر)</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-font-s">از</span>
            <Input
              type="number"
              min={0}
              value={filters.min_area ?? ""}
              onChange={(event) => update({ min_area: toNumberOrNull(event.target.value) })}
              placeholder="متر مربع"
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-font-s">تا</span>
            <Input
              type="number"
              min={0}
              value={filters.max_area ?? ""}
              onChange={(event) => update({ max_area: toNumberOrNull(event.target.value) })}
              placeholder="متر مربع"
              className="flex-1"
            />
          </div>
        </div>
      </section>

      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">قیمت هر متر مربع (تومان)</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-font-s">از</span>
            <Input
              type="number"
              min={0}
              value={filters.min_price ?? ""}
              onChange={(event) => update({ min_price: toNumberOrNull(event.target.value) })}
              placeholder="تومان"
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-font-s">تا</span>
            <Input
              type="number"
              min={0}
              value={filters.max_price ?? ""}
              onChange={(event) => update({ max_price: toNumberOrNull(event.target.value) })}
              placeholder="تومان"
              className="flex-1"
            />
          </div>
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">مشخصات ملک</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">تعداد خواب</label>
            <Input
              type="number"
              min={0}
              value={filters.bedrooms ?? ""}
              onChange={(event) => update({ bedrooms: toNumberOrNull(event.target.value) })}
              placeholder="انتخاب تعداد خواب"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">تعداد سرویس</label>
            <Input
              type="number"
              min={0}
              value={filters.bathrooms ?? ""}
              onChange={(event) => update({ bathrooms: toNumberOrNull(event.target.value) })}
              placeholder="انتخاب تعداد سرویس"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">آشپزخانه</label>
            <Input
              type="number"
              min={0}
              value={filters.kitchens ?? ""}
              onChange={(event) => update({ kitchens: toNumberOrNull(event.target.value) })}
              placeholder="تعداد آشپزخانه"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">پذیرایی</label>
            <Input
              type="number"
              min={0}
              value={filters.living_rooms ?? ""}
              onChange={(event) => update({ living_rooms: toNumberOrNull(event.target.value) })}
              placeholder="تعداد پذیرایی"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <BinarySwitch
              label="پارکینگ"
              value={filters.has_parking}
              onChange={(value) => update({ has_parking: value })}
            />
          </div>
          <div className="space-y-2">
            <BinarySwitch
              label="انباری"
              value={filters.has_storage}
              onChange={(value) => update({ has_storage: value })}
            />
          </div>
          <div className="space-y-2">
            <BinarySwitch
              label="آسانسور"
              value={filters.has_elevator}
              onChange={(value) => update({ has_elevator: value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">تعداد پارکینگ</label>
            <Input
              type="number"
              min={0}
              value={filters.parking_spaces ?? ""}
              onChange={(event) => update({ parking_spaces: toNumberOrNull(event.target.value) })}
              placeholder="تعداد پارکینگ"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">تعداد انباری</label>
            <Input
              type="number"
              min={0}
              value={filters.storage_rooms ?? ""}
              onChange={(event) => update({ storage_rooms: toNumberOrNull(event.target.value) })}
              placeholder="تعداد انباری"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">سال ساخت (شمسی)</label>
            <PopupPicker
              value={filters.year_built !== null ? String(filters.year_built) : ""}
              title="انتخاب سال ساخت"
              placeholder="همه سال‌ها"
              searchable
              searchPlaceholder="جستجوی سال ساخت"
              options={YEAR_BUILT_OPTIONS}
              onSelect={(value) => update({ year_built: toNumberOrNull(value) })}
            />
          </div>
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">مرتب‌سازی</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">مرتب‌سازی</label>
          <PopupPicker
            value={sortValue}
            title="انتخاب مرتب‌سازی"
            placeholder="مرتب‌سازی"
            options={[
              { value: "latest", title: "جدیدترین انتشار" },
              { value: "created_desc", title: "جدیدترین ثبت" },
              { value: "price_desc", title: "گران‌ترین" },
              { value: "price_asc", title: "ارزان‌ترین" },
              { value: "area_desc", title: "بیشترین متراژ" },
              { value: "views_desc", title: "پربازدیدترین" },
              { value: "favorites_desc", title: "محبوب‌ترین" },
              { value: "updated_desc", title: "آخرین بروزرسانی" },
            ]}
            onSelect={(value) => {
              const sortConfig = fromSortValue(value);
              update({
                order_by: sortConfig.order_by,
                order_desc: sortConfig.order_desc,
              });
            }}
          />
        </div>

      </section>

      <div className="pt-1">
        <Button type="button" variant="outline" onClick={onReset} className="w-full">
          پاک کردن همه فیلترها
        </Button>
      </div>
    </aside>
  );
}
