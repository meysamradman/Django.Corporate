export interface FooterLinkItem {
  title: string;
  href: string;
  order: number;
}

export interface FooterSectionItem {
  title: string;
  order: number;
  links: FooterLinkItem[];
}

export interface FooterAboutItem {
  title: string;
  text: string;
}
