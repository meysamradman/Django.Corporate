import { Base } from "@/types/shared/base";
import { Media } from "@/types/shared/media";

export interface PortfolioSEOMeta extends Base {
    meta_title?: string | null;
    meta_description?: string | null;
    og_title?: string | null;
    og_description?: string | null;
    portfolio_id: number;
    og_image_id?: number | null;
    og_image?: Pick<Media, 'id' | 'url'> | null;
}
