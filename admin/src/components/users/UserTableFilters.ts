import type { FilterConfig, FilterOption } from "@/components/tables/DataTable";

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
        title: "وضعیت",
        options: booleanFilterOptions,
        placeholder: "وضعیت",
        type: 'select'
    },
];
