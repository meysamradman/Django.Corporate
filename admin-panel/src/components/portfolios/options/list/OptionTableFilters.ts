import type { FilterConfig } from "@/types/shared/table";

export interface OptionFilters {
  is_active?: string;
  is_public?: string;
}

export const useOptionFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: "true" },
    { label: "خیر", value: "false" },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getOptionFilterConfig = (
  booleanFilterOptions: { label: string; value: string }[]
): FilterConfig[] => [
  {
    columnId: "is_active",
    title: "فعال",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "فعال",
  },
  {
    columnId: "is_public",
    title: "عمومی",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "عمومی",
  },
];