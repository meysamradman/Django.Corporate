export interface RealEstateListParams {
  search?: string;
  page?: number;
  size?: number;
  order_by?: string;
  order_desc?: boolean;
  status?: string;
  is_featured?: boolean;
  is_public?: boolean;
  is_active?: boolean;
  property_type?: number;
  state?: number;
  city?: number;
  province?: number;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
}

export interface RealEstateTaxonomyListParams {
  search?: string;
  page?: number;
  size?: number;
  is_public?: boolean;
  is_active?: boolean;
}
