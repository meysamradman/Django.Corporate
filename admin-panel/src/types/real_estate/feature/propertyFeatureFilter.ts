export interface PropertyFeatureListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean | string;
  category?: string;
  date_from?: string;
  date_to?: string;
  created_after?: string;
  created_before?: string;
  order_by?: string;
  order_desc?: boolean;
}

export interface PropertyFeatureFilters {
  is_active?: boolean;
  category?: string;
  [key: string]: string | boolean | number | undefined;
}
