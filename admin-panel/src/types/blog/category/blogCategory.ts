import type { Base } from "@/types/shared/base";
import type { Media } from "@/types/shared/media";
import type { BlogSEOMeta } from "@/types/blog/blogSeoMeta";

export interface BlogCategory extends Base {
    name: string;
    slug: string;
    parent_id?: number | null;
    is_public: boolean;
    is_active: boolean;
    image_id?: number | null;
    level?: number | null;
    parent?: Pick<BlogCategory, 'id' | 'public_id'> | null;
    image?: Media | null;
    image_url?: string | null;
    seo?: BlogSEOMeta | null;
    description?: string;
}