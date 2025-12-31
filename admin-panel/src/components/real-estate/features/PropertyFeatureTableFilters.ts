import type { FilterConfig } from "@/types/shared/table";

export const usePropertyFeatureFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getPropertyFeatureFilterConfig = (
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
    columnId: "date_from",
    title: "از تاریخ",
    type: "date",
    placeholder: "از تاریخ",
  },
  {
    columnId: "date_to",
    title: "تا تاریخ",
    type: "date",
    placeholder: "تا تاریخ",
  },
];

