import type { Base } from "@/types/shared/base";
import type { ApiPagination } from "@/types/shared/pagination";

/**
 * Social media links for agents/agencies
 */
export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  telegram?: string;
  youtube?: string;
  pinterest?: string;
  vimeo?: string;
  whatsapp?: string;
};

/**
 * Real Estate Agent
 * Represents a property agent/consultant
 */
export type Agent = Base & {
  user_id: number;
  user_name: string;
  user_email?: string;
  agency_id?: number;
  agency_name?: string;
  license_number: string;
  license_expire_date?: string;
  slug: string;
  specialization?: string;
  profile_picture?: string;
  is_verified: boolean;
  rating: number;
  total_sales: number;
  total_reviews: number;
  bio?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  address?: string;
  social_links?: SocialLinks;
  meta_title?: string;
  meta_description?: string;
};

/**
 * Real Estate Agency
 * Represents a real estate agency/company
 */
export type Agency = Base & {
  name: string;
  slug: string;
  license_number?: string;
  license_expire_date?: string;
  phone: string;
  mobile?: string;
  fax?: string;
  email?: string;
  website?: string;
  province_id?: number;
  province_name?: string;
  city_id?: number;
  city_name?: string;
  address?: string;
  profile_picture?: string;
  logo?: string;
  rating: number;
  total_reviews: number;
  description?: string;
  total_agents?: number;
  total_properties?: number;
  social_links?: SocialLinks;
  meta_title?: string;
  meta_description?: string;
};

/**
 * Listing parameters for agents
 */
export type AgentListParams = {
  page?: number;
  size?: number;
  search?: string;
  agency_id?: number;
  is_verified?: boolean;
  specialization?: string;
  min_rating?: number;
  order_by?: string;
  order_desc?: boolean;
};

/**
 * Listing parameters for agencies
 */
export type AgencyListParams = {
  page?: number;
  size?: number;
  search?: string;
  province_id?: number;
  city_id?: number;
  min_rating?: number;
  order_by?: string;
  order_desc?: boolean;
};

/**
 * Paginated response for agents
 */
export type AgentListResponse = {
  data: Agent[];
  pagination: ApiPagination;
};

/**
 * Paginated response for agencies
 */
export type AgencyListResponse = {
  data: Agency[];
  pagination: ApiPagination;
};
