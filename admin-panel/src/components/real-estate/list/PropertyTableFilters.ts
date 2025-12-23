import type { FilterConfig } from "@/types/shared/table";

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
  propertyTypeOptions: { label: string; value: string }[] = [],
  stateOptions: { label: string; value: string }[] = [],
  cityOptions: { label: string; value: string }[] = []
): FilterConfig[] => [
  {
    columnId: "is_published",
    title: "منتشر شده",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "منتشر شده",
  },
  {
    columnId: "is_featured",
    title: "ویژه",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "ویژه",
  },
  {
    columnId: "is_verified",
    title: "تایید شده",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "تایید شده",
  },
  {
    columnId: "is_active",
    title: "فعال",
    type: "select",
    options: booleanFilterOptions,
    placeholder: "فعال",
  },
  {
    columnId: "property_type",
    title: "نوع ملک",
    type: "select",
    options: propertyTypeOptions,
    placeholder: "نوع ملک",
  },
  {
    columnId: "state",
    title: "وضعیت",
    type: "select",
    options: stateOptions,
    placeholder: "وضعیت",
  },
  {
    columnId: "city",
    title: "شهر",
    type: "select",
    options: cityOptions,
    placeholder: "شهر",
  },
];

