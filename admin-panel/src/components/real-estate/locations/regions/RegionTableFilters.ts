import type { FilterConfig } from "@/types/shared/table";

export const getRegionFilterConfig = (
  cityOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
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
