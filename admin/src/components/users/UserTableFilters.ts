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
];
