import { FilterConfig } from "@/types/shared/table";
import { PortfolioFilters } from "@/types/portfolio/portfolioListParams";

// Filter options
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

// Filter configuration
export const getPortfolioFilterConfig = (
  statusFilterOptions: { label: string; value: string }[],
  booleanFilterOptions: { label: string; value: boolean }[],
  categoryOptions: { label: string; value: string }[] = [] // تغییر نوع value به string
): FilterConfig[] => [
  {
    columnId: "status",
    title: "وضعیت",
    type: "select",
    options: statusFilterOptions,
    placeholder: "وضعیت",
  },
  {
    columnId: "is_featured",
    title: "ویژه",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "ویژه",
  },
  {
    columnId: "is_public",
    title: "عمومی",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "عمومی",
  },
  {
    columnId: "is_active", // اضافه کردن فیلتر فعال بودن
    title: "فعال",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "فعال",
  },
  {
    columnId: "categories", // استفاده از نام ستون واقعی
    title: "دسته‌بندی",
    type: "hierarchical",
    options: categoryOptions, // استفاده از گزینه‌های دسته‌بندی
    placeholder: "انتخاب دسته‌بندی",
  },
];