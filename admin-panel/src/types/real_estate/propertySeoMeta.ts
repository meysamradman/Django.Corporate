import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";

export interface PropertySEOMeta extends Base {
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_id?: number | null;
  og_image?: Pick<Media, 'id' | 'file_url'> | null;
  canonical_url?: string | null;
  robots_meta?: string | null;
  structured_data?: Record<string, any> | null;
  hreflang_data?: Record<string, any> | null;
  property_id: number;
}

