import type { FilterConfig, CategoryItem } from "@/types/shared/table";

export const usePropertyFilterOptions = () => {
  const booleanFilterOptions = [
    { label: "بله", value: true },
    { label: "خیر", value: false },
  ];

  const publishStatusOptions = [
    { label: "منتشر شده", value: true },
    { label: "پیش‌نویس", value: false },
  ];

  return {
    booleanFilterOptions,
    publishStatusOptions,
  };
};

export const getPropertyFilterConfig = (
  booleanFilterOptions: { label: string; value: boolean }[],
  propertyTypeOptions: CategoryItem[] = [],
  stateOptions: { label: string; value: string }[] = [],
  provinceOptions: { label: string; value: string }[] = [],
  cityOptions: { label: string; value: string }[] = [],
  regionOptions: { label: string; value: string }[] = [],
  agentOptions: { label: string; value: string }[] = [],
  statusOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
    {
      columnId: "is_published",
      title: "انتشار",
      type: "faceted",
      options: [
        { label: "منتشر شده", value: true },
        { label: "پیش‌نویس", value: false },
      ],
      placeholder: "وضعیت انتشار",
      showSearch: false,
      multiSelect: false,
    },
    {
      columnId: "is_featured",
      title: "ویژه",
      type: "faceted",
      options: booleanFilterOptions,
      placeholder: "وضعیت ویژه",
      showSearch: false,
      multiSelect: false,
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
      columnId: "property_type",
      title: "نوع ملک",
      type: "hierarchical",
      options: propertyTypeOptions,
      placeholder: "نوع ملک",
      multiSelect: true,
      isAdvanced: true,
    },
    {
      columnId: "state",
      title: "وضعیت",
      type: "faceted",
      options: stateOptions,
      placeholder: "وضعیت",
      showSearch: true,
      multiSelect: true,
      isAdvanced: true,
    },
    {
      columnId: "province",
      title: "استان",
      type: "faceted",
      options: provinceOptions,
      placeholder: "استان",
      showSearch: true,
      multiSelect: true,
      isAdvanced: true,
    },
    {
      columnId: "city",
      title: "شهر",
      type: "faceted",
      options: cityOptions,
      placeholder: "شهر",
      showSearch: true,
      multiSelect: true,
      isAdvanced: true,
    },
    {
      columnId: "region",
      title: "منطقه",
      type: "faceted",
      options: regionOptions,
      placeholder: "منطقه",
      showSearch: true,
      multiSelect: true,
      isAdvanced: true,
    },
    {
      columnId: "agent",
      title: "مشاور",
      type: "faceted",
      options: agentOptions,
      placeholder: "مشاور",
      showSearch: true,
      multiSelect: true,
      isAdvanced: true,
    },
    {
      columnId: "status",
      title: "وضعیت فرآیند",
      type: "faceted",
      options: statusOptions,
      placeholder: "وضعیت فرآیند",
      showSearch: true,
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
