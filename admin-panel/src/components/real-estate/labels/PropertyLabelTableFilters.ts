import type { FilterConfig } from "@/types/shared/table";

export const usePropertyLabelFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getPropertyLabelFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[]
): FilterConfig[] => [
  {
    columnId: "is_active",
    title: "فعال",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "فعال",
  },
  {
    columnId: "date_range",
    title: "بازه تاریخ",
    type: "date_range",
    placeholder: "انتخاب بازه تاریخ",
  },
];

