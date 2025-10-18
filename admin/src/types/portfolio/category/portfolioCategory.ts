import { Base } from "@/types/shared/base";
import { Media } from "@/types/shared/media";
import { PortfolioSEOMeta } from "@/types/portfolio/portfolioSeoMeta";

export interface PortfolioCategory extends Base {
    name: string;
    slug: string;
    parent_id?: number | null;
    is_public: boolean;
    is_active: boolean;
    image_id?: number | null;
    level?: number | null;
    parent?: Pick<PortfolioCategory, 'id' | 'public_id'> | null;
    image?: Media | null;
    image_url?: string | null; // Add this field to match the API response
    seo?: PortfolioSEOMeta | null;
    description?: string;
}