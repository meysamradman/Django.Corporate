import type { FilterConfig } from "@/types/shared/table";

export const usePropertyStateFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getPropertyStateFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[],
  usageTypeOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
    {
      columnId: "usage_type",
      title: "نوع کاربری",
      type: "faceted",
      options: usageTypeOptions,
      placeholder: "نوع کاربری",
      showSearch: true,
      multiSelect: true,
    },
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

