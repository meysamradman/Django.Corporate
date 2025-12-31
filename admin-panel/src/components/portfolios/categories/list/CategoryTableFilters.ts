import type { FilterConfig } from "@/types/shared/table";

export interface CategoryFilters {
  is_active?: string;
  is_public?: string;
  date_from?: string;
  date_to?: string;
}

export const useCategoryFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: "true" },
    { label: "خیر", value: "false" },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getCategoryFilterConfig = (
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
  {
    columnId: "date_from",
    title: "از تاریخ",
    type: "date",
    placeholder: "از تاریخ",
  },
  {
    columnId: "date_to",
    title: "تا تاریخ",
    type: "date",
    placeholder: "تا تاریخ",
  },
];