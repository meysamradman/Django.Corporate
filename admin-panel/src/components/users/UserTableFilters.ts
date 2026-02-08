import type { FilterConfig, FilterOption } from "@/types/shared/table";

export const useUserFilterOptions = () => {
    const booleanFilterOptions: FilterOption[] = [
        { label: "بله", value: true },
        { label: "خیر", value: false }
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
            placeholder: "وضعیت فعال",
            type: 'faceted',
            showSearch: false,
            multiSelect: false,
        },
        {
            columnId: "date_range",
            title: "بازه تاریخ",
            placeholder: "انتخاب بازه تاریخ",
            type: 'date_range'
        },
    ];
