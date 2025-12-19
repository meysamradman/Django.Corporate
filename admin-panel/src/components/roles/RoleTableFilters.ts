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
            { label: "فعال", value: true },
            { label: "غیرفعال", value: false }
        ],
        placeholder: "وضعیت",
        type: 'select'
    },
    {
        columnId: "is_system_role",
        title: "نوع نقش",
        options: roleTypeFilterOptions,
        placeholder: "نوع نقش",
        type: 'select'
    },
];
