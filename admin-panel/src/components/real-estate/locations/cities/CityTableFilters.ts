import type { FilterConfig } from "@/types/shared/table";

export const getCityFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[] = [],
  provinceOptions: { label: string; value: string }[] = []
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
    columnId: "province_id",
    title: "استان",
    type: "faceted",
    options: provinceOptions,
    placeholder: "استان",
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
