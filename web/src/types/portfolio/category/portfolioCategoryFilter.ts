export interface PortfolioCategoryListParams {
  search?: string;
  page?: number;
  size?: number;
  ordering?: string;
  is_public?: boolean;
  is_active?: boolean;
  parent_id?: number;
}
