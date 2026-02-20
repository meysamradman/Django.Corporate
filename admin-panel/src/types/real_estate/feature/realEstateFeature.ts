import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";

export interface PropertyFeature extends Base {
  title: string;
  slug: string;
  group?: string | null;
  parent_id?: number | null;
  parent_title?: string | null;
  image?: Media | null;
  image_url?: string | null;
  is_active: boolean;
  property_count?: number;
}

