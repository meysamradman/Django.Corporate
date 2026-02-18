"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/elements/Input";
import { NativeSelect, NativeSelectOption } from "@/components/elements/NativeSelect";
import { Button } from "@/components/elements/Button";

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
 * - Navigates to /properties with query parameters when search is triggered
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
    const params = new URLSearchParams();

    if (location.trim()) {
      params.set("search", location.trim());
    }

    if (propertyType) {
      params.set("property_type", propertyType);
    }

    if (transactionState) {
      params.set("state", transactionState);
    }

    if (status) {
      params.set("status", status);
    }

    const query = params.toString();
    router.push(query ? `/properties?${query}` : "/properties");
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
                فروش / اجاره
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
                وضعیت ملک
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
