import { FilterConfig } from "@/components/tables/DataTable";

// Define category filter types
export interface CategoryFilters {
  is_active?: boolean;
  is_public?: boolean;
}

// Filter options
export const useCategoryFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: "true" },
    { label: "خیر", value: "false" },
  ];

  return {
    booleanFilterOptions,
  };
};

// Filter configuration
export const getCategoryFilterConfig = (
  booleanFilterOptions: { label: string; value: string }[]
): FilterConfig[] => [
  {
    columnId: "is_active",
    title: "فعال",
    type: "select",
    options: booleanFilterOptions,
  },
  {
    columnId: "is_public",
    title: "عمومی",
    type: "select",
    options: booleanFilterOptions,
  },
];