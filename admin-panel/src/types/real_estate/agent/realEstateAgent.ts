import type { Base } from "@/types/shared/base";
import type { RealEstateAgency } from "../agency/realEstateAgency";

export interface PropertyAgent extends Base {
  user: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  license_number?: string | null;
  license_expire_date?: string | null;
  bio?: string | null;
  specialization?: string | null;
  profile_picture_url?: string | null;
  profile_image?: { file_url: string } | null;

  province?: number | null;
  province_name?: string | null;
  city?: number | null;
  city_name?: string | null;
  address?: string | null;
  experience_years?: number | null;

  agency?: RealEstateAgency | null;

  is_verified: boolean;
  is_active: boolean;

  rating?: number | null;
  total_sales?: number;
  total_reviews?: number;
  property_count?: number;

  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  canonical_url?: string | null;
  robots_meta?: string | null;
}

