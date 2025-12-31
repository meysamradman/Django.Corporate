import type { FilterConfig } from "@/types/shared/table";

export const usePortfolioFilterOptions = () => {
  const statusFilterOptions = [
    { label: "منتشر شده", value: "published" },
    { label: "پیش‌نویس", value: "draft" },
  ];

  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  return {
    statusFilterOptions,
    booleanFilterOptions,
  };
};

export const getPortfolioFilterConfig = (
  statusFilterOptions: { label: string; value: string }[],
  booleanFilterOptions: { label: string; value: boolean }[],
  categoryOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
  {
    columnId: "status",
    title: "وضعیت",
    type: "faceted",
    options: statusFilterOptions,
    placeholder: "وضعیت",
    showSearch: false,
  },
  {
    columnId: "is_featured",
    title: "ویژه",
    type: "faceted",
    options: booleanFilterOptions,
    placeholder: "ویژه",
    showSearch: false,
  },
  {
    columnId: "is_public",
    title: "عمومی",
    type: "faceted",
    options: booleanFilterOptions,
    placeholder: "عمومی",
    showSearch: false,
  },
  {
    columnId: "is_active",
    title: "فعال",
    type: "faceted",
    options: booleanFilterOptions,
    placeholder: "فعال",
    showSearch: false,
  },
  {
    columnId: "categories",
    title: "دسته‌بندی",
    type: "hierarchical",
    options: categoryOptions,
    placeholder: "دسته‌بندی",
  },
  {
    columnId: "date_range",
    title: "بازه تاریخ",
    type: "date_range",
    placeholder: "انتخاب بازه تاریخ",
  },
];