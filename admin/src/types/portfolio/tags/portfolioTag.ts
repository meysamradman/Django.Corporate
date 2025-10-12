import { Base } from "@/types/shared/base";
import { PortfolioSEOMeta } from "@/types/portfolio/portfolioSeoMeta";

export interface PortfolioTag extends Base {
    name: string;
    slug: string;
    description?: string;
    is_active?: boolean;
    is_public?: boolean;
    seo?: PortfolioSEOMeta | null;
}