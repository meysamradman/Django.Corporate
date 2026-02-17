export interface BlogListParams {
  search?: string;
  page?: number;
  size?: number;
  ordering?: string;
  order_by?: string;
  order_desc?: boolean;
  status?: string;
  is_featured?: string | boolean;
  is_public?: string | boolean;
  is_active?: string | boolean;
  categories__in?: string;
}

