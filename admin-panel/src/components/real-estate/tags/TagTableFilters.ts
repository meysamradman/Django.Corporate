import type { FilterConfig } from "@/types/shared/table";

export const usePropertyTagFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getPropertyTagFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[]
): FilterConfig[] => [
  {
    columnId: "is_active",
    title: "فعال",
    type: "faceted",
    options: booleanFilterOptions,
    placeholder: "فعال",
    showSearch: false,
  },
  {
    columnId: "is_public",
    title: "عمومی",
    type: "faceted",
    options: booleanFilterOptions,
    placeholder: "عمومی",
    showSearch: false,
  },
  {
    columnId: "date_range",
    title: "بازه تاریخ",
    type: "date_range",
    placeholder: "انتخاب بازه تاریخ",
  },
];

