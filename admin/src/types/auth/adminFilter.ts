export interface Filter {
    [key: string]: string | number | boolean | string[] | undefined;
    search_query?: string;
    page?: number;
    size?: number;
    limit?: number;
    offset?: number;
}

export interface AdminFilter extends Filter {
    is_active?: boolean;
    is_superuser?: boolean;
}

export interface UserFilter extends Filter {
    is_active?: boolean;
}

