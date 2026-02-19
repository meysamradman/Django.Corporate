"use client";

import React from "react";
import { Button } from "@/components/elements/custom/button";
import { Input } from "@/components/elements/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/select";
import { fromSortValue, toSortValue } from "@/components/real-estate/search/filters";
import type { PropertySearchFilters } from "@/types/real-estate/searchFilters";

export type SidebarOption = {
  id: number;
  value: string;
  title: string;
  slug?: string;
};

type PropertySearchSidebarProps = {
  filters: PropertySearchFilters;
  isLoading?: boolean;
  typeOptions: SidebarOption[];
  stateOptions: SidebarOption[];
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

const cardClassName = "rounded-md border bg-card p-3 space-y-3";

const toBoolString = (value: boolean | null): string => {
  if (value === null) return "";
  return value ? "true" : "false";
};

const fromBoolString = (value: string): boolean | null => {
  if (!value) return null;
  return value === "true";
};

const toNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
};

export default function PropertySearchSidebar({
  filters,
  isLoading = false,
  typeOptions,
  stateOptions,
  labelOptions,
  tagOptions,
  featureOptions,
  statusOptions,
  onFiltersChange,
  onReset,
}: PropertySearchSidebarProps) {
  const sortValue = toSortValue(filters);
  const selectedTypeValue =
    filters.property_type !== null
      ? String(filters.property_type)
      : typeOptions.find((item) => item.slug === filters.type_slug)?.value || "";
  const selectedStateValue =
    filters.state !== null
      ? String(filters.state)
      : stateOptions.find((item) => item.slug === filters.state_slug)?.value || "";

  const update = (updates: Partial<PropertySearchFilters>) => {
    onFiltersChange({ ...updates, page: 1 });
  };

  return (
    <aside className="space-y-3">
      <div className="rounded-lg border bg-card p-4 md:p-5 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">فیلترهای جستجو</h2>
        <span className="text-xs text-font-s">{isLoading ? "در حال بروزرسانی..." : "آماده"}</span>
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">جستجو</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">عبارت جستجو</label>
          <Input
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="عنوان، توضیحات، محله..."
          />
        </div>
        <p className="text-xs text-font-s">با تایپ، نتایج به‌صورت خودکار بروزرسانی می‌شود.</p>
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">وضعیت آگهی</h3>
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
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">نوع و معامله</h3>
        <div className="space-y-2">
          <label className="text-sm text-font-s">نوع ملک</label>
          <NativeSelect
            value={selectedTypeValue}
            onChange={(event) => {
              const value = event.target.value;
              const selected = typeOptions.find((item) => item.value === value);
              update({
                property_type: toNumberOrNull(value),
                type_slug: selected?.slug || "",
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
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">موقعیت</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">استان (ID)</label>
            <Input
              type="number"
              min={0}
              value={filters.province ?? ""}
              onChange={(event) => update({ province: toNumberOrNull(event.target.value) })}
              placeholder="province"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">شهر (ID)</label>
            <Input
              type="number"
              min={0}
              value={filters.city ?? ""}
              onChange={(event) => update({ city: toNumberOrNull(event.target.value) })}
              placeholder="city"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">منطقه (ID)</label>
            <Input
              type="number"
              min={0}
              value={filters.region ?? ""}
              onChange={(event) => update({ region: toNumberOrNull(event.target.value) })}
              placeholder="region"
            />
          </div>
        </div>
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">قیمت و متراژ</h3>
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
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">مشخصات ملک</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-font-s">تعداد خواب</label>
            <Input
              type="number"
              min={0}
              value={filters.bedrooms ?? ""}
              onChange={(event) => update({ bedrooms: toNumberOrNull(event.target.value) })}
              placeholder="2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-font-s">تعداد حمام</label>
            <Input
              type="number"
              min={0}
              value={filters.bathrooms ?? ""}
              onChange={(event) => update({ bathrooms: toNumberOrNull(event.target.value) })}
              placeholder="1"
            />
          </div>
        </div>
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">برچسب‌گذاری</h3>
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
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">زمان و انتشار</h3>
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
      </div>

      <div className={cardClassName}>
        <h3 className="text-sm font-semibold">مرتب‌سازی و پیشرفته</h3>
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
            <label className="text-sm text-font-s">اسلاگ نوع (پیشرفته)</label>
            <Input
              value={filters.type_slug}
              onChange={(event) => update({ type_slug: event.target.value, property_type: null })}
              placeholder="type_slug"
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
      </div>

      <div className="rounded-lg border bg-card p-3">
        <Button type="button" variant="outline" onClick={onReset} className="w-full">
          پاک کردن همه فیلترها
        </Button>
      </div>
    </aside>
  );
}
