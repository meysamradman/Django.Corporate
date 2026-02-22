import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";

export interface PropertyState extends Base {
  title: string;
  slug: string;
  short_description?: string;
  usage_type: string;
  is_active: boolean;
  property_count?: number;
  image_id?: number | null;
  image?: Media | null;
  image_url?: string | null;
}

