export interface RealEstateAgency {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  license_number: string;
  license_expire_date: string | null;
  phone: string;
  email: string;
  website?: string;
  province?: number;
  province_name?: string;
  city: number;
  city_name?: string;
  address: string;
  logo?: {
    id: number;
    file_url: string;
    title?: string;
    media_type?: string;
    alt_text?: string;
    is_active?: boolean;
    public_id?: string;
    created_at?: string;
    created_by?: number;
    updated_at?: string;
    updated_by?: number;
  } | null;
  cover_image?: {
    id: number;
    file_url: string;
    title?: string;
    media_type?: string;
    alt_text?: string;
    is_active?: boolean;
    public_id?: string;
    created_at?: string;
    created_by?: number;
    updated_at?: string;
    updated_by?: number;
  } | null;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property_count?: number;
  agent_count?: number;

  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  canonical_url?: string;
  robots_meta?: string;
}

export interface AgencyFormData {
  name: string;
  license_number: string;
  license_expire_date: string;
  phone: string;
  email: string;
  website: string;
  province: string;
  city: string;
  address: string;
  logo: any;
  cover_image: any;
  description: string;
  rating: string;
  is_verified: boolean;
  is_active: boolean;
}
