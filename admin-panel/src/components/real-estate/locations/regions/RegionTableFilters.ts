import type { FilterConfig } from "@/types/shared/table";

export const getRegionFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[] = [],
  cityOptions: { label: string; value: string }[] = []
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
    columnId: "city_id",
    title: "شهر",
    type: "faceted",
    options: cityOptions,
    placeholder: "شهر",
    showSearch: true,
    multiSelect: false,
  },
  {
    columnId: "date_range",
    title: "بازه تاریخ",
    type: "date_range",
    placeholder: "انتخاب بازه تاریخ",
  },
];
