import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";
import type { PropertySEOMeta } from "@/types/real_estate/realEstateSeoMeta";

export interface PropertyType extends Base {
  title: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  level?: number;
  display_order: number;
  is_active: boolean;
  is_public: boolean;
  property_count?: number;
  has_children?: boolean;
  image_id?: number | null;
  image?: Media | null;
  image_url?: string | null;
  seo?: PropertySEOMeta | null;
}

