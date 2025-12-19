import type { Base } from "@/types/shared/base";

export interface PortfolioOption extends Base {
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    is_public: boolean;
    portfolio_id?: number;
    portfolio_count?: number;
    created_at: string;
    updated_at: string;
}