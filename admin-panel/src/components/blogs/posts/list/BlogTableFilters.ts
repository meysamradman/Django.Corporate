import type { FilterConfig } from "@/types/shared/table";

export const useBlogFilterOptions = () => {
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

export const getBlogFilterConfig = (
  statusFilterOptions: { label: string; value: string }[],
  booleanFilterOptions: { label: string; value: boolean }[],
  categoryOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
    {
      columnId: "status",
      title: "انتشار",
      type: "faceted",
      options: statusFilterOptions,
      placeholder: "وضعیت انتشار",
      showSearch: false,
      multiSelect: false,
    },
    {
      columnId: "is_featured",
      title: "ویژه",
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "ویژه",
      showSearch: false,
      multiSelect: false,
    },
    {
      columnId: "is_public",
      title: "عمومی",
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "عمومی",
      showSearch: false,
      multiSelect: false,
    },
    {
      columnId: "is_active",
      title: "فعال",
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "فعال",
      showSearch: false,
      multiSelect: false,
    },
    {
      columnId: "category",
      title: "دسته‌بندی",
      type: "hierarchical",
      options: categoryOptions,
      placeholder: "دسته‌بندی",
      multiSelect: true,
      isAdvanced: true,
    },
    {
      columnId: "date_range",
      title: "بازه تاریخ",
      type: "date_range",
      placeholder: "انتخاب بازه تاریخ",
      isAdvanced: true,
    },
  ];