export interface AdminRoleListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean | string;
  is_system_role?: boolean | string;
  date_from?: string;
  date_to?: string;
  created_after?: string;
  created_before?: string;
  level_min?: number;
  level_max?: number;
  users_count_min?: number;
  users_count_max?: number;
  order_by?: string;
  order_desc?: boolean;
}

export interface AdminRoleFilters {
  is_active?: boolean;
  is_system_role?: boolean;
  level_min?: number;
  level_max?: number;
  [key: string]: string | boolean | number | undefined;
}
