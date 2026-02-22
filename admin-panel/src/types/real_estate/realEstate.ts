import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";
import type { PropertyType } from "./type/propertyType";
import type { PropertyState } from "./listing-types/realEstateListingTypes";
import type { PropertyLabel } from "./label/realEstateLabel";
import type { PropertyFeature } from "./feature/realEstateFeature";
import type { PropertyTag } from "./tags/realEstateTag";
import type { PropertyAgent } from "./agent/realEstateAgent";
import type { RealEstateAgency } from "./agency/realEstateAgency";
import type { PropertySEOMeta } from "./realEstateSeoMeta";

export interface Property extends Omit<Base, "created_by"> {
  title: string;
  slug: string;
  created_by?: number; // ✅ User ID
  short_description: string;
  description: string;
  is_published: boolean;
  is_featured: boolean;
  is_public: boolean;
  is_active: boolean;
  status: string;

  main_image?: {
    id: number;
    url?: string;
    file_url?: string;
    title: string;
    alt_text: string;
  } | null;

  property_type?: PropertyType | null;
  state?: PropertyState | null;
  agent?: PropertyAgent | null;
  agency?: RealEstateAgency | null;
  labels: PropertyLabel[];
  tags: PropertyTag[];
  features: PropertyFeature[];

  province?: number | null;
  province_name?: string;
  city?: number | null;
  city_name?: string;
  region?: number | null;  // CityRegion (optional)
  region_name?: string;
  district?: number | null;  // Backend field name
  district_name?: string;  // Backend field name
  neighborhood?: string;  // text field
  address?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  price?: number | null;
  sale_price?: number | null;
  pre_sale_price?: number | null;
  price_per_sqm?: number | null;

  monthly_rent?: number | null;
  rent_amount?: number | null;
  mortgage_amount?: number | null;
  security_deposit?: number | null;

  land_area?: number | null;
  built_area?: number | null;

  bedrooms?: number | null;
  bathrooms?: number | null;
  kitchens?: number | null;
  living_rooms?: number | null;

  year_built?: number | null;
  build_years?: number | null;
  floors_in_building?: number | null;
  floor_number?: number | null;

  parking_spaces?: number | null;
  storage_rooms?: number | null;
  document_type?: string | null;
  has_document?: boolean | null;
  capacity?: number | null;

  extra_attributes?: Record<string, any>;
  currency?: string;  // واحد پول

  views_count?: number;
  web_views_count?: number;
  app_views_count?: number;
  favorites_count?: number;
  inquiries_count?: number;

  published_at?: string | null;

  media_count?: number;
  labels_count?: number;
  tags_count?: number;
  features_count?: number;

  media?: PropertyMediaItem[];
  property_media?: PropertyMediaItem[];
  floor_plans?: FloorPlan[];

  seo_status?: {
    score: number;
    total: number;
    status: string;
  };

  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: Media | null;
  og_image_id?: number | null;
  canonical_url?: string | null;
  robots_meta?: string | null;
  structured_data?: Record<string, any> | null;
  hreflang_data?: Record<string, any> | null;

  seo_data?: PropertySEOMeta;
  seo_preview?: {
    google: {
      title: string;
      description: string;
      url: string;
    };
    facebook: {
      title?: string | null;
      description?: string | null;
      image?: string | null;
    };
  };
  seo_completeness?: {
    score: number;
    total: number;
    status: string;
    missing_fields: string[];
  };
  created_by_name?: string | null;
}

export interface PropertyMediaItem {
  id: number;
  public_id: string;
  media_detail: Media;
  media: Media;
  is_main_image?: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface FloorPlan {
  id: number;
  title: string;
  slug: string;
  description?: string;
  floor_size: number;
  size_unit: 'sqft' | 'sqm';
  bedrooms?: number | null;
  bathrooms?: number | null;
  price?: number | null;
  currency?: string;
  floor_number?: number | null;
  unit_type?: string;
  display_order: number;
  is_available: boolean;
  main_image?: {
    id: number;
    url?: string;
    file_url?: string;
    title: string;
    alt_text: string;
  } | null;
  image_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyUpdateData extends Partial<Omit<Property,
  'property_type' | 'state' | 'agent' | 'agency' | 'labels' | 'tags' | 'features' |
  'main_image' | 'og_image' | 'media' | 'property_media' | 'seo_data' | 'seo_preview' | 'seo_completeness'>> {
  property_type?: number | null;
  state?: number | null;
  agent?: number | null;
  agency?: number | null;
  labels_ids?: number[];
  tags_ids?: number[];
  features_ids?: number[];
  province?: number | null;
  city?: number | null;
  region?: number | null;  // optional CityRegion
  neighborhood?: string;
  media_ids?: number[];
  media_files?: File[];
  main_image_id?: number | null;
  media_covers?: { [mediaId: number]: number | null };
  og_image_id?: number | null;
  extra_attributes?: Record<string, any>;
  status?: string;
}

