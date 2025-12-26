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
        type: 'select'
    },
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