export interface PublicContactPhone {
  phone_number: string;
  label: string;
  order: number;
}

export interface PublicContactMobile {
  mobile_number: string;
  label: string;
  order: number;
}

export interface PublicContactEmail {
  email: string;
  label: string;
  order: number;
}

export interface PublicSocialMedia {
  name: string;
  url: string;
  order: number;
  icon_url: string | null;
}

export interface PublicMapSettings {
  provider: string;
  configs: unknown;
}

export interface PublicContactSettings {
  phones: PublicContactPhone[];
  mobiles: PublicContactMobile[];
  emails: PublicContactEmail[];
  social_media: PublicSocialMedia[];
  map_settings: PublicMapSettings | null;
}
