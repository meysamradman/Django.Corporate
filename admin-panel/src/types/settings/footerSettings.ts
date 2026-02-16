export interface FooterSection {
    id: number;
    public_id: string;
    title: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FooterSectionCreate {
    title: string;
    order?: number;
    is_active?: boolean;
}

export interface FooterSectionUpdate {
    title?: string;
    order?: number;
    is_active?: boolean;
}

export interface FooterLink {
    id: number;
    public_id: string;
    section: number;
    title: string;
    href: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FooterLinkCreate {
    section: number;
    title: string;
    href: string;
    order?: number;
    is_active?: boolean;
}

export interface FooterLinkUpdate {
    section?: number;
    title?: string;
    href?: string;
    order?: number;
    is_active?: boolean;
}

export interface FooterAbout {
    id: number;
    public_id: string;
    title: string;
    text: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FooterAboutCreate {
    title: string;
    text: string;
    is_active?: boolean;
}

export interface FooterAboutUpdate {
    title?: string;
    text?: string;
    is_active?: boolean;
}
