"use client";

import React from "react";
import { realEstateApi } from "@/api/real-estate/route";
import { Button } from "@/components/elements/custom/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/elements/dialog";
import { Input } from "@/components/elements/input";
import { Separator } from "@/components/elements/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/select";
import { ChevronDown } from "lucide-react";
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
  labelOptions: SidebarOption[];
  tagOptions: SidebarOption[];
  featureOptions: SidebarOption[];
  statusOptions: SidebarOption[];
  onFiltersChange: (updates: Partial<PropertySearchFilters>) => void;
  onReset: () => void;
};

const EMPTY_SELECT_VALUE = "__empty__";

function NativeSelect({ className, children, value, defaultValue, onChange, ...props }: React.ComponentProps<"select">) {
  const optionElements = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<
    React.ComponentProps<"option">
  >[];
  const mappedValue = value === "" ? EMPTY_SELECT_VALUE : (value as string | undefined);
  const mappedDefaultValue = defaultValue === "" ? EMPTY_SELECT_VALUE : (defaultValue as string | undefined);
  const placeholderOption = optionElements.find((option) => String(option.props.value ?? "") === "");

  return (
    <Select
      value={mappedValue}
      defaultValue={mappedValue === undefined ? mappedDefaultValue : undefined}
      onValueChange={(nextValue) => {
        const normalizedValue = nextValue === EMPTY_SELECT_VALUE ? "" : nextValue;
        onChange?.({ target: { value: normalizedValue } } as React.ChangeEvent<HTMLSelectElement>);
      }}
      disabled={props.disabled}
    >
      <SelectTrigger
      id={props.id}
      className={`w-full rounded-md border border-br bg-wt px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
      >
        <SelectValue placeholder={placeholderOption?.props.children as React.ReactNode} />
      </SelectTrigger>
      <SelectContent>
        {optionElements.map((option, index) => {
          const optionValue = String(option.props.value ?? "");
          const mappedOptionValue = optionValue === "" ? EMPTY_SELECT_VALUE : optionValue;

          return (
            <SelectItem key={`${mappedOptionValue}-${index}`} value={mappedOptionValue} disabled={option.props.disabled}>
              {option.props.children}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function NativeSelectOption(_props: React.ComponentProps<"option">) {
  return null;
}

const sectionClassName = "space-y-3";

const toBoolString = (value: boolean | null): string => {
  if (value === null) return "";
  return value ? "true" : "false";
};

const fromBoolString = (value: string): boolean | null => {
  if (!value) return null;
  return value === "true";
};

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim().replace(/,/g, "");

  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
};

type PopupPickerOption = {
  value: string;
  title: string;
};

function PopupPicker({
  value,
  title,
  placeholder,
  options,
  onSelect,
  disabled = false,
}: {
  value: string;
  title: string;
  placeholder: string;
  options: PopupPickerOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((item) => item.value === value);
  const displayText = selected?.title || placeholder;

  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(disabled ? false : next)}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-br bg-wt px-3 text-sm text-font-p shadow-xs outline-none transition-colors focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="line-clamp-1">{displayText}</span>
          <ChevronDown className="size-4 text-font-s" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm border-br bg-card p-0" showCloseButton={false}>
        <DialogHeader className="border-b border-br px-4 py-3 text-right">
          <DialogTitle className="text-sm font-black text-font-p">{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {options.map((item) => {
            const isActive = item.value === value;
            return (
              <button
                key={`${item.value || "empty"}-${item.title}`}
                type="button"
                onClick={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center rounded-md px-2.5 py-2 text-right text-sm transition-colors ${
                  isActive ? "bg-bg text-font-p" : "text-font-s hover:bg-bg hover:text-font-p"
                }`}
              >
                <span className="line-clamp-1">{item.title}</span>
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
            بستن
          </button>
        </div>
      </DialogContent>
    </Dialog>
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
  labelOptions,
  tagOptions,
  featureOptions,
  statusOptions,
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-black text-font-p">فیلترهای جستجو</h2>
        <span className="text-xs text-font-s">{isLoading ? "در حال بروزرسانی..." : "آماده"}</span>
      </div>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">جستجو</h3>
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
        <h3 className="text-sm font-black text-font-p">وضعیت آگهی</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">وضعیت</label>
          <NativeSelect value={filters.status} onChange={(event) => update({ status: event.target.value })}>
            <NativeSelectOption value="">همه وضعیت‌ها</NativeSelectOption>
            {statusOptions.map((item) => (
              <NativeSelectOption key={item.id} value={item.value}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">نوع و معامله</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">نوع ملک</label>
          <NativeSelect
            value={selectedTypeValue}
            onChange={(event) => {
              const value = event.target.value;
              const selected = typeOptions.find((item) => item.value === value);
              const nextTypeSlug = selected?.slug || "";
              const nextTypeId = toNumberOrNull(value);
              update({
                property_type: nextTypeId,
                type_slug: nextTypeSlug,
              });
            }}
          >
            <NativeSelectOption value="">همه</NativeSelectOption>
            {typeOptions.map((item) => (
              <NativeSelectOption key={item.id} value={item.value}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-font-s">نوع معامله</label>
          <NativeSelect
            value={selectedStateValue}
            onChange={(event) => {
              const value = event.target.value;
              const selected = stateOptions.find((item) => item.value === value);
              update({
                state: toNumberOrNull(value),
                state_slug: selected?.slug || "",
              });
            }}
          >
            <NativeSelectOption value="">همه</NativeSelectOption>
            {stateOptions.map((item) => (
              <NativeSelectOption key={item.id} value={item.value}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
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
        <h3 className="text-sm font-black text-font-p">قیمت و متراژ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">حداقل قیمت</label>
            <Input
              type="number"
              min={0}
              value={filters.min_price ?? ""}
              onChange={(event) => update({ min_price: toNumberOrNull(event.target.value) })}
              placeholder="1000000000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">حداکثر قیمت</label>
            <Input
              type="number"
              min={0}
              value={filters.max_price ?? ""}
              onChange={(event) => update({ max_price: toNumberOrNull(event.target.value) })}
              placeholder="5000000000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">حداقل متراژ</label>
            <Input
              type="number"
              min={0}
              value={filters.min_area ?? ""}
              onChange={(event) => update({ min_area: toNumberOrNull(event.target.value) })}
              placeholder="60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">حداکثر متراژ</label>
            <Input
              type="number"
              min={0}
              value={filters.max_area ?? ""}
              onChange={(event) => update({ max_area: toNumberOrNull(event.target.value) })}
              placeholder="250"
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
            <Input
              type="number"
              min={1300}
              max={1550}
              value={filters.year_built ?? ""}
              onChange={(event) => update({ year_built: toNumberOrNull(event.target.value) })}
              placeholder="مثال: 1402"
            />
          </div>
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">برچسب‌گذاری</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">برچسب</label>
          <NativeSelect
            value={filters.label_public_id}
            onChange={(event) => update({ label_public_id: event.target.value })}
          >
            <NativeSelectOption value="">همه</NativeSelectOption>
            {labelOptions.map((item) => (
              <NativeSelectOption key={item.id} value={item.value}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-font-s">تگ</label>
          <NativeSelect value={filters.tag_slug} onChange={(event) => update({ tag_slug: event.target.value })}>
            <NativeSelectOption value="">همه</NativeSelectOption>
            {tagOptions.map((item) => (
              <NativeSelectOption key={item.id} value={item.value}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-font-s">ویژگی</label>
          <NativeSelect
            value={filters.feature_public_id}
            onChange={(event) => update({ feature_public_id: event.target.value })}
          >
            <NativeSelectOption value="">همه</NativeSelectOption>
            {featureOptions.map((item) => (
              <NativeSelectOption key={item.id} value={item.value}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">زمان و انتشار</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">تاریخ ایجاد از</label>
            <Input
              type="date"
              value={filters.created_after}
              onChange={(event) => update({ created_after: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">تاریخ ایجاد تا</label>
            <Input
              type="date"
              value={filters.created_before}
              onChange={(event) => update({ created_before: event.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">فقط ویژه</label>
            <NativeSelect
              value={toBoolString(filters.is_featured)}
              onChange={(event) => update({ is_featured: fromBoolString(event.target.value) })}
            >
              <NativeSelectOption value="">مهم نیست</NativeSelectOption>
              <NativeSelectOption value="true">بله</NativeSelectOption>
              <NativeSelectOption value="false">خیر</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">عمومی بودن</label>
            <NativeSelect
              value={toBoolString(filters.is_public)}
              onChange={(event) => update({ is_public: fromBoolString(event.target.value) })}
            >
              <NativeSelectOption value="">مهم نیست</NativeSelectOption>
              <NativeSelectOption value="true">عمومی</NativeSelectOption>
              <NativeSelectOption value="false">غیرعمومی</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">فعال بودن</label>
            <NativeSelect
              value={toBoolString(filters.is_active)}
              onChange={(event) => update({ is_active: fromBoolString(event.target.value) })}
            >
              <NativeSelectOption value="">مهم نیست</NativeSelectOption>
              <NativeSelectOption value="true">فعال</NativeSelectOption>
              <NativeSelectOption value="false">غیرفعال</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
      </section>
      <Separator className="bg-br" />

      <section className={sectionClassName}>
        <h3 className="text-sm font-black text-font-p">مرتب‌سازی و پیشرفته</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">مرتب‌سازی</label>
          <NativeSelect
            value={sortValue}
            onChange={(event) => {
              const sortConfig = fromSortValue(event.target.value);
              update({
                order_by: sortConfig.order_by,
                order_desc: sortConfig.order_desc,
              });
            }}
          >
            <NativeSelectOption value="latest">جدیدترین انتشار</NativeSelectOption>
            <NativeSelectOption value="created_desc">جدیدترین ثبت</NativeSelectOption>
            <NativeSelectOption value="price_desc">گران‌ترین</NativeSelectOption>
            <NativeSelectOption value="price_asc">ارزان‌ترین</NativeSelectOption>
            <NativeSelectOption value="area_desc">بیشترین متراژ</NativeSelectOption>
            <NativeSelectOption value="views_desc">پربازدیدترین</NativeSelectOption>
            <NativeSelectOption value="favorites_desc">محبوب‌ترین</NativeSelectOption>
            <NativeSelectOption value="updated_desc">آخرین بروزرسانی</NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">اسلاگ نوع (SEO)</label>
            <Input
              value={filters.type_slug}
              onChange={(event) => update({ type_slug: event.target.value, property_type: null })}
              placeholder="type"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">اسلاگ وضعیت (پیشرفته)</label>
            <Input
              value={filters.state_slug}
              onChange={(event) => update({ state_slug: event.target.value, state: null })}
              placeholder="state_slug"
            />
          </div>
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
