import type { Base } from "@/types/shared/base";

export interface PropertyFeature extends Base {
  title: string;
  category?: string | null;
  is_active: boolean;
}

