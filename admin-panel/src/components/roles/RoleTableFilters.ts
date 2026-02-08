import type { FilterConfig, FilterOption } from "@/types/shared/table";

export const useRoleFilterOptions = () => {
    const roleTypeFilterOptions: FilterOption[] = [
        { label: "سیستمی", value: true },
        { label: "سفارشی", value: false }
    ];

    return { roleTypeFilterOptions };
};

export const getRoleFilterConfig = (
    roleTypeFilterOptions: FilterOption[]
): FilterConfig[] => [
        {
            columnId: "is_active",
            title: "وضعیت",
            options: [
                { label: "بله", value: true },
                { label: "خیر", value: false }
            ],
            placeholder: "وضعیت فعال",
            type: 'faceted',
            showSearch: false,
            multiSelect: false,
        },
        {
            columnId: "is_system_role",
            title: "نوع نقش",
            options: roleTypeFilterOptions,
            placeholder: "نوع نقش",
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
