import type { FilterConfig } from "@/types/shared/table";

export const getCityFilterConfig = (
  provinceOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
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
