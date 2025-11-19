import { Media } from "@/types/shared/media";
import { Base } from "@/types/shared/base";
import { ProvinceCompact, CityCompact } from "@/types/shared/location";
import { PermissionProfile } from "@/types/auth/permission";

// User Base Interface
export interface User extends Base {
    mobile: string;
    email: string | null;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    user_type: string;
    full_name: string;
}

// User Profile Interface
export interface UserProfile extends Base {
    first_name: string;
    last_name: string;
    full_name: string;
    national_id: string | null;
    birth_date: string | null;
    address: string | null;
    phone: string | null;
    province: ProvinceCompact | null;
    city: CityCompact | null;
    bio: string | null;
    profile_picture: Media | null;
}

// User With Profile Interface
export interface UserWithProfile extends Base {
    mobile: string;
    email: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    is_super?: boolean;
    is_admin_full?: boolean;
    user_type: string;
    profile?: UserProfile;
    permissions?: string[];
    permission_profile?: PermissionProfile;
    roles?: Array<{
        id: number;
        name: string;
    }>;
    password?: string;
    identifier?: string;
    role_id?: number | string | null;
    full_name?: string;
}

// User Creation Request Interface
export interface UserCreateRequest {
    identifier: string;
    password: string;
    full_name: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    user_type: string;
    
    // Profile fields
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    national_id?: string;
    address?: string;
    phone?: string;
    province_id?: number;
    city_id?: number;
    bio?: string;
    profile_picture_id?: number;
}

// User Update Request Interface
export interface UserUpdateRequest {
    mobile?: string;
    email?: string;
    is_active?: boolean;
    
    // Profile fields
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    national_id?: string;
    address?: string;
    phone?: string;
    province_id?: number;
    city_id?: number;
    bio?: string;
    profile_picture_id?: number;
}

// API Request/Response Types
export interface UserListParams {
    search?: string;
    page?: number;
    size?: number;
    order_by?: string;
    order_desc?: boolean;
    is_active?: boolean;
    [key: string]: unknown;
}

export interface UserFilters {
    is_active?: boolean;
    user_type?: string;
    [key: string]: unknown;
}