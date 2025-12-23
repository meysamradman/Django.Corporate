import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";
import type { PropertySEOMeta } from "../propertySeoMeta";

export interface RealEstateAgency extends Base {
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  license_number?: string | null;
  
  manager?: number | null;
  
  city?: number | null;
  city_name?: string;
  province?: number | null;
  province_name?: string;
  address?: string | null;
  
  logo?: Media | null;
  cover_image?: Media | null;
  
  is_verified: boolean;
  is_active: boolean;
  
  rating?: number | null;
  total_reviews?: number;
  
  seo?: PropertySEOMeta | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: Media | null;
  canonical_url?: string | null;
}

