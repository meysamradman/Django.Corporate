export interface BlogCategoryListParams {
  search?: string;
  page?: number;
  size?: number;
  is_public?: boolean;
  is_active?: boolean;
  parent_id?: number;
}
