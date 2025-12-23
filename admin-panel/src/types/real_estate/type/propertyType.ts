import type { Base } from "@/types/shared/base";

export interface PropertyType extends Base {
  title: string;
  display_order: number;
  is_active: boolean;
}

