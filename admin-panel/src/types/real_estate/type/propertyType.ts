import type { Base } from "@/types/shared/base";

export interface PropertyType extends Base {
  title: string;
  slug: string;
  display_order: number;
  is_active: boolean;
}

