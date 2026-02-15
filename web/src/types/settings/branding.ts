export interface SiteLogo {
  site_name: string;
  logo_url: string | null;
}

export interface HomeSliderItem {
  id: number;
  title: string;
  description: string;
  link: string;
  order: number;
  media_type: 'image' | 'video';
  media_url: string | null;
}
