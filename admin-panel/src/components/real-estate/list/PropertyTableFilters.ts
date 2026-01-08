import type { FilterConfig, CategoryItem } from "@/types/shared/table";

export const usePropertyFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  return {
    booleanFilterOptions,
  };
};

export const getPropertyFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[],
  propertyTypeOptions: CategoryItem[] = [],
  stateOptions: { label: string; value: string }[] = [],
  cityOptions: { label: string; value: string }[] = [],
  statusOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
    {
      columnId: "is_published",
      title: "منتشر شده",
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "منتشر شده",
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
      columnId: "is_active",
      title: "فعال",
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "فعال",
      showSearch: false,
    },
    {
      columnId: "property_type",
      title: "نوع ملک",
      type: "hierarchical",
      options: propertyTypeOptions,
      placeholder: "نوع ملک",
      multiSelect: true,
    },
    {
      columnId: "state",
      title: "وضعیت",
      type: "faceted",
      options: stateOptions,
      placeholder: "وضعیت",
      showSearch: true,
      multiSelect: true,
    },
    {
      columnId: "city",
      title: "شهر",
      type: "faceted",
      options: cityOptions,
      placeholder: "شهر",
      showSearch: true,
      multiSelect: true,
    },
    {
      columnId: "status",
      title: "وضعیت فرآیند",
      type: "faceted",
      options: statusOptions,
      placeholder: "وضعیت فرآیند",
      showSearch: true,
      multiSelect: true,
    },
    {
      columnId: "date_range",
      title: "بازه تاریخ",
      type: "date_range",
      placeholder: "انتخاب بازه تاریخ",
    },
  ];
