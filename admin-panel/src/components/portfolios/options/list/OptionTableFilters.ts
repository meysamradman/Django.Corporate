import type { FilterConfig } from "@/types/shared/table";

export interface OptionFilters {
  is_active?: string;
  is_public?: string;
  date_from?: string;
  date_to?: string;
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
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "وضعیت فعال",
      showSearch: false,
      multiSelect: false,
    },
    {
      columnId: "is_public",
      title: "عمومی",
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "وضعیت عمومی",
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