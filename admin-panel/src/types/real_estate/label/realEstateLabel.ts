import type { Base } from "@/types/shared/base";

export interface PropertyLabel extends Base {
  title: string;
  slug: string;
  is_active: boolean;
  property_count?: number;
}

