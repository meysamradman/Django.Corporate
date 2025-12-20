import type { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import type { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import type { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import type { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import type { Base } from "@/types/shared/base";
import type { PortfolioSEOMeta } from "@/types/portfolio/portfolioSeoMeta";
import type { Media } from "@/types/shared/media";

export interface Portfolio extends Base {
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
    categories: PortfolioCategory[];
    options: PortfolioOption[];
    tags: PortfolioTag[];
    portfolio_media?: PortfolioMedia[];
    
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
    
    seo?: PortfolioSEOMeta;
}

export interface PortfolioUpdateData extends Partial<Portfolio> {
  categories_ids?: number[];
  tags_ids?: number[];
  options_ids?: number[];
  media_ids?: number[];
  main_image_id?: number | null;
  media_covers?: { [mediaId: number]: number | null };
}