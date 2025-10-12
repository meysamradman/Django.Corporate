import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { Base } from "@/types/shared/base";
import { PortfolioSEOMeta } from "@/types/portfolio/portfolioSeoMeta";
import { Media } from "@/types/shared/media";

export interface Portfolio extends Base {
    status: "draft" | "published";
    title: string;
    slug: string;
    short_description: string;
    description: string;
    is_featured: boolean;
    is_public: boolean;
    // is_active: boolean; // Removed because it's inherited from Base and not used in the UI
    categories: PortfolioCategory[];
    options: PortfolioOption[];
    tags: PortfolioTag[];
    portfolio_media: PortfolioMedia[];
    
    // SEO fields
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
    
    // SEO meta (optional)
    seo?: PortfolioSEOMeta;
}