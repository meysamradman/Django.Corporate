import type { FilterConfig, FilterOption } from "@/types/shared/table";

export const useAdminFilterOptions = () => {
    const booleanFilterOptions: FilterOption[] = [
        { label: "فعال", value: true },
        { label: "غیرفعال", value: false }
    ];

    const roleFilterOptions: FilterOption[] = [
        { label: "سوپر ادمین", value: true },
        { label: "ادمین عادی", value: false }
    ];

    return { booleanFilterOptions, roleFilterOptions };
};

export const getAdminFilterConfig = (
    booleanFilterOptions: FilterOption[],
    roleFilterOptions: FilterOption[]
): FilterConfig[] => [
    {
        columnId: "is_active",
        title: "وضعیت",
        options: booleanFilterOptions,
        placeholder: "وضعیت",
        type: 'select'
    },
    {
        columnId: "is_superuser",
        title: "نقش",
        options: roleFilterOptions,
        placeholder: "نقش",
        type: 'select'
    },
]; 