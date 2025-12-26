import type { Media } from "@/types/shared/media";
import type { Base } from "@/types/shared/base";
import type { PermissionCategory, PermissionProfile, Role } from "@/types/auth/permission";
import type { ProvinceCompact, CityCompact } from "@/types/shared/location";
import type { Pagination } from '@/types/api/apiResponse';

export type UserStatus = 'active' | 'inactive' | 'all';
export type UserType = 'admin' | 'user';
export type UserRoleType = 'admin' | 'consultant';

// فیلدهای PropertyAgent برای مشاورین املاک
export interface PropertyAgentProfile {
    id: number;
    public_id: string;
    license_number: string;
    license_expire_date: string | null;
    specialization: string;
    agency: {
        id: number;
        name: string;
        slug: string;
    } | null;
    rating: number;
    total_sales: number;
    total_reviews: number;
    bio: string;
    is_verified: boolean;
    is_active: boolean;
    slug: string;
    // SEO fields
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_title: string;
    og_description: string;
    og_image: {
        id: number;
        url: string;
    } | null;
    twitter_card: 'summary' | 'summary_large_image' | null;
    created_at: string;
    updated_at: string;
}

export interface Admin extends Base {
    mobile: string;
    email: string | null;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    full_name: string;
}

export interface AdminProfile extends Base {
    first_name: string;
    last_name: string;
    full_name: string;
    birth_date: string | null;
    national_id: string | null;
    address: string | null;
    phone: string | null;
    province: ProvinceCompact | null;
    city: CityCompact | null;
    bio: string | null;
    profile_picture: Media | null;
    department?: string | null;
    position?: string | null;
}

export interface AdminWithProfile extends Base {
    mobile: string;
    email: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    is_admin_full?: boolean;
    profile?: AdminProfile;
    permissions?: string[];
    permission_categories?: PermissionCategory;
    permission_profile?: PermissionProfile;
    roles?: Role[];
    password?: string;
    identifier?: string;
    role_id?: number | string | null;
    full_name: string;
    user_role_type?: 'admin' | 'consultant';
    has_agent_profile?: boolean;
    agent_profile?: PropertyAgentProfile;
}

export interface AdminCreateRequest {
    mobile: string;
    email?: string;
    password: string;
    full_name: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    user_type: string;
    role_id?: number;
    admin_role_type?: 'admin' | 'consultant';
    
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    national_id?: string;
    address?: string;
    phone?: string;
    province_id?: number;
    city_id?: number;
    department?: string;
    position?: string;
    bio?: string;
    notes?: string;
    profile_picture_id?: number;
    
    // فیلدهای مشاور املاک
    license_number?: string;
    license_expire_date?: string;
    specialization?: string;
    agency_id?: number;
}

export interface AdminUpdateRequest {
    mobile?: string;
    email?: string;
    full_name?: string;
    password?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    role_id?: number;
    
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    national_id?: string;
    address?: string;
    phone?: string;
    province_id?: number;
    city_id?: number;
    department?: string;
    position?: string;
    bio?: string;
    notes?: string;
    profile_picture_id?: number;
    
    // فیلدهای مشاور املاک
    license_number?: string;
    license_expire_date?: string;
    specialization?: string;
    agency_id?: number;
}

export interface AdminListParams {
    search?: string;
    page?: number;
    size?: number;
    order_by?: string;
    order_desc?: boolean;
    is_active?: boolean;
    is_superuser?: boolean;
    user_role_type?: UserRoleType;
    roles?: string[];
    [key: string]: string | number | boolean | string[] | undefined;
}

export interface AdminCreateData {
    mobile: string;
    email?: string;
    full_name: string;
    password: string;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    role_ids?: number[];
}

export interface AdminUpdateData {
    mobile?: string;
    email?: string;
    full_name?: string;
    password?: string;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    role_ids?: number[];
}

export interface AdminStatusUpdate {
    is_active: boolean;
}

export interface AdminFilters {
    search?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    user_role_type?: UserRoleType;
    roles?: string[];
    [key: string]: string | number | boolean | string[] | undefined;
}

export interface AdminTableData extends AdminWithProfile {
    role_count: number;
    permission_count: number;
}

export interface AdminFormData {
    mobile: string;
    email: string;
    full_name: string;
    password: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    role_ids: number[];
}

export interface AdminListResponse {
  data?: AdminWithProfile[];
  results?: AdminWithProfile[];
  pagination?: Pagination;
  count?: number;
  next?: string | null;
  previous?: string | null;
}