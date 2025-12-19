import type { Base } from "@/types/shared/base";
import type { BlogSEOMeta } from "@/types/blog/blogSeoMeta";

export interface BlogTag extends Base {
    name: string;
    slug: string;
    description?: string;
    is_active?: boolean;
    is_public?: boolean;
    seo?: BlogSEOMeta | null;
}