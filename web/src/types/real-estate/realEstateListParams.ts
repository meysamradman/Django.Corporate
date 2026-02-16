export interface RealEstateListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  ordering?: string;
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  is_active?: boolean;
  property_type?: number;
  state?: number;
  city?: number;
  province?: number;
  region?: number;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  bathrooms?: number;
  created_after?: string;
  created_before?: string;
  type_slug?: string;
  state_slug?: string;
  tag_slug?: string;
  label_slug?: string;
  label_public_id?: string;
  feature_public_id?: string;
}

export interface RealEstateTaxonomyListParams {
  search?: string;
  page?: number;
  size?: number;
  is_public?: boolean;
  is_active?: boolean;
}
