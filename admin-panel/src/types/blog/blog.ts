import type { BlogCategory } from "@/types/blog/category/blogCategory";
import type { BlogTag } from "@/types/blog/tags/blogTag";
import type { BlogMedia } from "@/types/blog/blogMedia";
import type { Base } from "@/types/shared/base";
import type { BlogSEOMeta } from "@/types/blog/blogSeoMeta";
import type { Media } from "@/types/shared/media";

export interface Blog extends Base {
    status: "draft" | "published";
    title: string;
    slug: string;
    short_description: string;
    description: string;
    is_featured: boolean;
    is_public: boolean;
    is_active: boolean;
    main_image?: {
        id: number;
        file_url: string;
        title: string;
        alt_text: string;
    } | null;
    categories_count?: number;
    tags_count?: number;
    media_count?: number;
    images_count?: number;
    videos_count?: number;
    audios_count?: number;
    documents_count?: number;
    seo_status?: {
        score: number;
        total: number;
        status: string;
    };
    images?: Array<{
        id: number;
        title: string;
        url?: string | null;
        order: number;
    }>;
    videos?: Array<{
        id: number;
        title: string;
        cover_url?: string | null;
        order: number;
    }>;
    audios?: Array<{
        id: number;
        title: string;
        cover_url?: string | null;
        order: number;
    }>;
    documents?: Array<{
        id: number;
        title: string;
        cover_url?: string | null;
        order: number;
    }>;
    categories: BlogCategory[];
    tags: BlogTag[];
    blog_media?: BlogMedia[];
    
    meta_title?: string | null;
    meta_description?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    og_image_id?: number | null;
    og_image?: Media | null;
    canonical_url?: string | null;
    robots_meta?: string | null;
    structured_data?: Record<string, any> | null;
    hreflang_data?: Record<string, any> | null;
    
    seo?: BlogSEOMeta;
}