import type { Base } from "@/types/shared/base";
import type { PortfolioSEOMeta } from "@/types/portfolio/portfolioSeoMeta";

export interface PortfolioTag extends Base {
    name: string;
    slug: string;
    description?: string;
    is_active?: boolean;
    is_public?: boolean;
    seo?: PortfolioSEOMeta | null;
}