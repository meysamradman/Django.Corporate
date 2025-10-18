import { Media } from "@/types/shared/media";

export interface PortfolioMediaImage {
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

export interface PortfolioMediaVideo {
    id: string;
    public_id: string;
    media: Media;
    order: number;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface PortfolioMediaAudio {
    id: string;
    public_id: string;
    media: Media;
    order: number;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface PortfolioMediaDocument {
    id: string;
    public_id: string;
    media: Media;
    order: number;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export type PortfolioMedia = PortfolioMediaImage | PortfolioMediaVideo | PortfolioMediaAudio | PortfolioMediaDocument;