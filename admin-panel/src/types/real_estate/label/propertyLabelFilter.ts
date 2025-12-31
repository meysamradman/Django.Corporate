export interface PropertyLabelListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean | string;
  date_from?: string;
  date_to?: string;
  created_after?: string;
  created_before?: string;
  order_by?: string;
  order_desc?: boolean;
}

export interface PropertyLabelFilters {
  is_active?: boolean;
  [key: string]: string | boolean | number | undefined;
}
