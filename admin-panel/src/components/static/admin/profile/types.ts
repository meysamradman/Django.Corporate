export interface AdminPropertyItem {
  id: number;
  title: string;
  city: string;
  propertyType?: string;
  dealType?: "فروش" | "اجاره" | "رهن و اجاره" | "پیش‌فروش";
  status: "فعال" | "در انتظار" | "غیرفعال";
  price?: string;
  viewLink?: string;
  updatedAt: string;
}

export interface AdminProfileFormState {
  firstName: string;
  lastName: string;
  roleTitle: string;
  birthDate: string;
  nationalId: string;
  phone: string;
  mobile: string;
  email: string;
  province: string;
  city: string;
  address: string;
  bio: string;
  active: boolean;
  createdAt: string;
  instagram: string;
  telegram: string;
  linkedin: string;
  website: string;
  avatarUrl: string;
  coverUrl: string;
  profileViews: string;
  propertyCount: string;
  ticketCount: string;
}
