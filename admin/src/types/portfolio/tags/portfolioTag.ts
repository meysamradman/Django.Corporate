import { Base } from "@/types/shared/base";
import { PortfolioSEOMeta } from "@/types/portfolio/portfolioSeoMeta";

export interface PortfolioTag extends Base {
    is_active?: boolean;
    seo?: PortfolioSEOMeta | null;
}