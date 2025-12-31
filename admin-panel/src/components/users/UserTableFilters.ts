import type { FilterConfig, FilterOption } from "@/types/shared/table";

export const useUserFilterOptions = () => {
    const booleanFilterOptions: FilterOption[] = [
        { label: "فعال", value: true },
        { label: "غیرفعال", value: false }
    ];

    return { booleanFilterOptions };
};

export const getUserFilterConfig = (
    booleanFilterOptions: FilterOption[]
): FilterConfig[] => [
    {
        columnId: "is_active",
        title: "فعال",
        options: booleanFilterOptions,
        placeholder: "فعال",
        type: 'select'
    },
    {
        columnId: "date_from",
        title: "از تاریخ",
        placeholder: "از تاریخ",
        type: 'date'
    },
    {
        columnId: "date_to",
        title: "تا تاریخ",
        placeholder: "تا تاریخ",
        type: 'date'
    },
];
