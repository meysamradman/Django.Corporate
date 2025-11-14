import { FilterConfig } from "@/types/shared/table";

// Define tag filter types
export interface TagFilters {
  is_active?: boolean;
  is_public?: boolean;
}

// Filter options
export const useTagFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: "true" },
    { label: "خیر", value: "false" },
  ];

  return {
    booleanFilterOptions,
  };
};

// Filter configuration
export const getTagFilterConfig = (
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