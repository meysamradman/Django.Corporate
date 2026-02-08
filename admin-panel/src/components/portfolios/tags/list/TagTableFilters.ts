import type { FilterConfig } from "@/types/shared/table";

export interface TagFilters {
  is_active?: boolean;
  is_public?: boolean;
  date_from?: string;
  date_to?: string;
}

export const useTagFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: "true" },
    { label: "خیر", value: "false" },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getTagFilterConfig = (
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