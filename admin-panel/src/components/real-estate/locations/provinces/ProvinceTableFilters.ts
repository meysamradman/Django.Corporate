import type { FilterConfig } from "@/types/shared/table";

export const useProvinceFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  return {
    booleanFilterOptions,
    emptyOptions: [] as { label: string; value: string }[],
  };
};

export const getProvinceFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[] = []
): FilterConfig[] => [
  {
    columnId: "is_active",
    title: "فعال",
    type: "faceted",
    options: booleanFilterOptions,
    placeholder: "وضعیت فعال",
    showSearch: false,
    multiSelect: false,
  },
  {
    columnId: "date_range",
    title: "بازه تاریخ",
    type: "date_range",
    placeholder: "انتخاب بازه تاریخ",
  },
];
