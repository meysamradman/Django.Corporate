import { FilterConfig } from "@/components/tables/DataTable";

// Define portfolio filter types
export interface PortfolioFilters {
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  // is_active?: boolean; // Removed because backend doesn't support filtering by is_active
}

// Filter options
export const usePortfolioFilterOptions = () => {
  const statusFilterOptions = [
    { label: "منتشر شده", value: "published" },
    { label: "پیش‌نویس", value: "draft" },
  ];

  const booleanFilterOptions = [
    { label: "بله", value: "true" },
    { label: "خیر", value: "false" },
  ];

  return {
    statusFilterOptions,
    booleanFilterOptions,
  };
};

// Filter configuration
export const getPortfolioFilterConfig = (
  statusFilterOptions: { label: string; value: string }[],
  booleanFilterOptions: { label: string; value: string }[]
): FilterConfig[] => [
  {
    columnId: "status",
    title: "وضعیت",
    type: "select",
    options: statusFilterOptions,
  },
  {
    columnId: "is_featured",
    title: "ویژه",
    type: "select",
    options: booleanFilterOptions,
  },
  {
    columnId: "is_public",
    title: "عمومی",
    type: "select",
    options: booleanFilterOptions,
  },
  // Removed is_active filter because backend doesn't support filtering by is_active
];