import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";

export interface RealEstateAgency extends Base {
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  license_number?: string | null;
  license_expire_date?: string | null;
  
  province?: number | null;
  province_name?: string;
  city?: number | null;
  city_name?: string;
  address?: string | null;
  
  logo?: Media | null;
  logo_url?: string | null;
  cover_image?: Media | null;
  
  is_verified: boolean;
  is_active: boolean;
  
  rating?: number | null;
  total_reviews?: number;
  property_count?: number;
  agent_count?: number;
  
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  canonical_url?: string | null;
  robots_meta?: string | null;
}

export interface RealEstateAgencyCompact {
  id: number;
  public_id: string;
  name: string;
  slug: string;
}

