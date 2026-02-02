import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";

export interface PropertyFeature extends Base {
  title: string;
  group?: string | null;
  image?: Media | null;
  image_url?: string | null;
  is_active: boolean;
  property_count?: number;
}

