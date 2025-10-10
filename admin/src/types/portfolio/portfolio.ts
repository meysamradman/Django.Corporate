import { PortfolioCategory } from "@/types/portfolio/category/portfolioCategory";
import { PortfolioTag } from "@/types/portfolio/tags/portfolioTag";
import { PortfolioOption } from "@/types/portfolio/options/portfolioOption";
import { PortfolioMedia } from "@/types/portfolio/portfolioMedia";
import { Base } from "@/types/shared/base";
import { PortfolioSEOMeta } from "@/types/portfolio/portfolioSeoMeta";

export interface Portfolio extends Base {
    status: "draft" | "published";
    is_featured: boolean;
    is_public: boolean;
    is_active: boolean;
    categories: PortfolioCategory[];
    options: PortfolioOption[];
    tags: PortfolioTag[];
    portfolio_media: PortfolioMedia[];
    seo?: PortfolioSEOMeta;
}