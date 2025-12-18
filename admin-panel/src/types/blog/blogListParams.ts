export interface BlogListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  status?: string;
  is_featured?: string | boolean;
  is_public?: string | boolean;
  is_active?: string | boolean;
  categories__in?: string;
}

export interface BlogFilters {
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  is_active?: boolean;
  categories?: number | string;
  [key: string]: string | boolean | number | undefined;
}

export interface CategoryListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean;
  is_public?: boolean;
  created_after?: string;
  created_before?: string;
}

export interface TagListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean;
  is_public?: boolean;
}

export interface BlogExportParams extends BlogListParams {
  export_all?: boolean;
}

