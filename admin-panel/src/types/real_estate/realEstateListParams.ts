export interface PropertyListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  
  is_published?: string | boolean;
  is_featured?: string | boolean;
  is_public?: string | boolean;
  is_verified?: string | boolean;
  is_active?: string | boolean;
  
  created_after?: string;
  created_before?: string;
  published_after?: string;
  published_before?: string;
  
  property_type?: number | string;
  state?: number | string;
  agent?: number | string;
  agency?: number | string;
  city?: number | string;
  province?: number | string;
  district?: number | string;
  
  label?: number | string;
  labels__in?: string;
  tag?: number | string;
  tags__in?: string;
  feature?: number | string;
  features__in?: string;
  
  min_price?: number | string;
  max_price?: number | string;
  min_area?: number | string;
  max_area?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  
  seo_status?: "complete" | "incomplete" | "missing";
  has_meta_title?: boolean | string;
  has_meta_description?: boolean | string;
  has_og_image?: boolean | string;
  has_canonical_url?: boolean | string;
  
  has_main_image?: boolean | string;
  media_count?: number | string;
  media_count_gte?: number | string;
  date_from?: string;
  date_to?: string;
}

export interface PropertyFilters {
  is_published?: boolean;
  is_featured?: boolean;
  is_public?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
  property_type?: number | string;
  state?: number | string;
  agent?: number | string;
  agency?: number | string;
  city?: number | string;
  province?: number | string;
  district?: number | string;
  [key: string]: string | boolean | number | undefined;
}

export interface PropertyExportParams extends PropertyListParams {
  export_all?: boolean;
}

