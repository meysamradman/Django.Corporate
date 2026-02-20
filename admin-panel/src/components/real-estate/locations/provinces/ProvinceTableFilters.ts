import type { FilterConfig } from "@/types/shared/table";

export const useProvinceFilterOptions = () => {
  return {
    emptyOptions: [] as { label: string; value: string }[],
  };
};

export const getProvinceFilterConfig = (): FilterConfig[] => [
  {
    columnId: "date_range",
    title: "بازه تاریخ",
    type: "date_range",
    placeholder: "انتخاب بازه تاریخ",
  },
];
