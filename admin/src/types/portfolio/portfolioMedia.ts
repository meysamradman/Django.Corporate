import { Media } from "@/types/shared/media";

export interface PortfolioMedia {
    id: string;
    public_id: string;
    media: Media;
    is_main_image: boolean;
    order: number;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}