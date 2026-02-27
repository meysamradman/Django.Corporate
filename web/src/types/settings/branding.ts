export interface SiteLogo {
  site_name: string;
  logo_url: string | null;
}

export interface HomeSliderItem {
  id: number;
  public_id: string;
  title: string;
  description: string;
  link: string;
  order: number;
  media_type: 'image' | 'video';
  media_url: string | null;
  media_poster_url?: string | null;
}
