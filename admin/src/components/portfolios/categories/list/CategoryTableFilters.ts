import { FilterConfig } from "@/components/tables/DataTable";

// Define category filter types
export interface CategoryFilters {
  is_active?: string; // تغییر نوع به string
  is_public?: string; // تغییر نوع به string
}

// Filter options
export const useCategoryFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: "true" }, // تغییر مقدار به string
    { label: "خیر", value: "false" }, // تغییر مقدار به string
  ];

  return {
    booleanFilterOptions,
  };
};

// Filter configuration
export const getCategoryFilterConfig = (
  booleanFilterOptions: { label: string; value: string }[] // تغییر نوع مقدار
): FilterConfig[] => [
  {
    columnId: "is_active",
    title: "فعال",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "فعال", // اضافه کردن placeholder
  },
  {
    columnId: "is_public",
    title: "عمومی",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "عمومی", // اضافه کردن placeholder
  },
];