export interface PortfolioOptionListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean | string;
  is_public?: boolean | string;
  date_from?: string;
  date_to?: string;
  created_after?: string;
  created_before?: string;
  order_by?: string;
  order_desc?: boolean;
}

export interface PortfolioOptionFilters {
  is_active?: boolean;
  is_public?: boolean;
  [key: string]: string | boolean | number | undefined;
}