import type { Base } from "@/types/shared/base";

export interface PropertyState extends Base {
  title: string;
  slug: string;
  usage_type: string;
  is_active: boolean;
  property_count?: number;
}

