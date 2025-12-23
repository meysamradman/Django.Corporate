import type { Base } from "@/types/shared/base";
import type { RealEstateAgency } from "../agency/realEstateAgency";
import type { Media } from "@/types/shared/media";
import type { PropertySEOMeta } from "../propertySeoMeta";

export interface PropertyAgent extends Base {
  user: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  license_number?: string | null;
  bio?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  
  agency?: RealEstateAgency | null;
  city?: number | null;
  city_name?: string;
  province?: number | null;
  province_name?: string;
  address?: string | null;
  
  profile_image?: Media | null;
  cover_image?: Media | null;
  
  is_verified: boolean;
  is_active: boolean;
  
  rating?: number | null;
  total_sales?: number;
  total_reviews?: number;
  
  seo?: PropertySEOMeta | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: Media | null;
  canonical_url?: string | null;
}

