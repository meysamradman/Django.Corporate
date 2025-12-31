export interface PropertyAgentListParams {
  search?: string;
  page?: number;
  size?: number;
  is_active?: boolean | string;
  is_verified?: boolean | string;
  agency_id?: number | string;
  city_id?: number | string;
  date_from?: string;
  date_to?: string;
  created_after?: string;
  created_before?: string;
  order_by?: string;
  order_desc?: boolean;
  rating_min?: number;
  rating_max?: number;
}

export interface PropertyAgentFilters {
  is_active?: boolean;
  is_verified?: boolean;
  agency_id?: number;
  city_id?: number;
  [key: string]: string | boolean | number | undefined;
}
