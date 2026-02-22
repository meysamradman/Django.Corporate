"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/elements/input";
import { Button } from "@/components/elements/custom/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/elements/select";
import { filtersToHref, resolvePropertySearchFilters } from "@/components/real-estate/search/filters";

/**
 * Option type for Hero Search dropdowns
 * Used to populate select options for property types, states, and statuses
 */
export type HeroSearchOption = {
  id: number;
  value: string;
  title: string;
};

type PropertyHeroSearchProps = {
  /** Available property type options (e.g., آپارتمان, ویلا, ...) */
  typeOptions: HeroSearchOption[];
  /** Available transaction state options (e.g., فروش, اجاره, ...) */
  stateOptions: HeroSearchOption[];
  /** Available property status options (e.g., منتشر شده, پیش‌نویس, ...) */
  statusOptions: HeroSearchOption[];
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
      className={`w-full rounded-md border border-br bg-wt px-3 text-sm shadow-xs outline-none focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ""}`}
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

/**
 * PropertyHeroSearch - Hero search bar for real estate properties
 * 
 * A prominent search component typically placed below the main slider/hero section.
 * Allows users to quickly filter properties by location, type, transaction state, and status.
 * 
 * Features:
 * - Client-side interactivity with instant state updates
 * - Keyboard support (Enter key triggers search)
 * - Responsive design (mobile-first grid layout)
 * - Navigates to canonical property search URL (same contract as sidebar filters)
 * - SSR-friendly: options are fetched on server and passed as props
 * 
 * @example
 * ```tsx
 * <PropertyHeroSearch
 *   typeOptions={[{ id: 1, value: "1", title: "آپارتمان" }]}
 *   stateOptions={[{ id: 1, value: "1", title: "فروش" }]}
 *   statusOptions={[{ id: 1, value: "published", title: "منتشر شده" }]}
 * />
 * ```
 */

export default function PropertyHeroSearch({
  typeOptions,
  stateOptions,
  statusOptions,
}: PropertyHeroSearchProps) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [transactionState, setTransactionState] = useState("");
  const [status, setStatus] = useState("");

  const handleSearch = () => {
    const baseFilters = resolvePropertySearchFilters({});
    const href = filtersToHref(baseFilters, {
      search: location.trim(),
      type_slug: propertyType || "",
      property_type: null,
      state_slug: transactionState || "",
      state: null,
      status: status || "",
      page: 1,
    });

    router.push(href);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 py-8 shadow-2xl">
      <div className="container mx-auto px-4">
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-end">
            {/* Search by Location */}
            <div>
              <label htmlFor="location-search" className="block text-sm font-medium text-white mb-2">
                جستجو بر اساس موقعیت
              </label>
              <Input
                id="location-search"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="شهر، منطقه، محله..."
                className="bg-white/95 border-0 h-11 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* Property Type */}
            <div>
              <label htmlFor="property-type" className="block text-sm font-medium text-white mb-2">
                نوع ملک
              </label>
              <NativeSelect
                id="property-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="bg-white/95 border-0 h-11 text-gray-900"
              >
                <NativeSelectOption value="">همه انواع</NativeSelectOption>
                {typeOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.value}>
                    {option.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {/* Sell or Rent */}
            <div>
              <label htmlFor="transaction-state" className="block text-sm font-medium text-white mb-2">
                نوع معامله
              </label>
              <NativeSelect
                id="transaction-state"
                value={transactionState}
                onChange={(e) => setTransactionState(e.target.value)}
                className="bg-white/95 border-0 h-11 text-gray-900"
              >
                <NativeSelectOption value="">همه</NativeSelectOption>
                {stateOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.value}>
                    {option.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {/* Property Status */}
            <div>
              <label htmlFor="property-status" className="block text-sm font-medium text-white mb-2">
                وضعیت انتشار
              </label>
              <NativeSelect
                id="property-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-white/95 border-0 h-11 text-gray-900"
              >
                <NativeSelectOption value="">همه وضعیت‌ها</NativeSelectOption>
                {statusOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.value}>
                    {option.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {/* Search Button */}
            <div>
              <Button
                onClick={handleSearch}
                className="w-full sm:w-auto h-11 px-8 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="ml-2 size-5" />
                جستجو
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
