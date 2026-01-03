import type { Base } from "@/types/shared/base";
import type { PropertySEOMeta } from "../realEstateSeoMeta";

export interface PropertyTag extends Base {
  title: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  is_public?: boolean;
  seo?: PropertySEOMeta | null;
}

