import type { FilterConfig, FilterOption } from "@/types/shared/table";

export const useAdminFilterOptions = () => {
    const booleanFilterOptions: FilterOption[] = [
        { label: "بله", value: true },
        { label: "خیر", value: false }
    ];

    const roleFilterOptions: FilterOption[] = [
        { label: "سوپر ادمین", value: true },
        { label: "ادمین عادی", value: false }
    ];

    const userRoleTypeOptions: FilterOption[] = [
        { label: "ادمین‌ها", value: "admin" },
        { label: "مشاورین املاک", value: "consultant" }
    ];

    return { booleanFilterOptions, roleFilterOptions, userRoleTypeOptions };
};

export const getAdminFilterConfig = (
    booleanFilterOptions: FilterOption[],
    roleFilterOptions: FilterOption[],
    userRoleTypeOptions: FilterOption[]
): FilterConfig[] => [
        {
            columnId: "user_role_type",
            title: "نوع کاربر",
            options: userRoleTypeOptions,
            placeholder: "نوع کاربر",
            type: 'faceted',
            showSearch: false,
            multiSelect: false,
        },
        {
            columnId: "is_active",
            title: "وضعیت",
            options: booleanFilterOptions,
            placeholder: "وضعیت فعال",
            type: 'faceted',
            showSearch: false,
            multiSelect: false,
        },
        {
            columnId: "is_superuser",
            title: "نقش",
            options: roleFilterOptions,
            placeholder: "نقش",
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