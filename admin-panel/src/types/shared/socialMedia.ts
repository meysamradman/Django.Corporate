import type { Media } from "@/types/shared/media";

export interface SocialMediaItem {
  id?: number;
  public_id?: string;
  name: string;
  url: string;
  icon?: number | null;
  icon_url?: string | null;
  icon_data?: Media | null;
  order?: number;
}
