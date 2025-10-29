import { Media } from "@/types/shared/media";
import { Base } from "@/types/shared/base";
import { PermissionCategory, Role } from "@/types/auth/permission";
import { ProvinceCompact, CityCompact } from "@/types/shared/location";

// Admin Base Interface
export interface Admin extends Base {
    mobile: string;
    email: string | null;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    full_name: string;
}

// Admin Profile Interface
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
}

// Admin With Profile Interface
export interface AdminWithProfile extends Base {
    mobile: string;
    email: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    profile?: AdminProfile;
    permissions?: string[];
    permission_categories?: PermissionCategory;
    roles?: Role[];
    password?: string;
    identifier?: string;
    role_id?: number | string | null;
    full_name: string;
}

// Admin Creation Request Interface
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
    
    // Profile fields
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
}

// Admin Update Request Interface
export interface AdminUpdateRequest {
    mobile?: string;
    email?: string;
    full_name?: string;
    password?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    role_id?: number;
    
    // Profile fields
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
}

// API Request/Response Types
export interface AdminListParams {
    search?: string;
    page?: number;
    size?: number;
    order_by?: string;
    order_desc?: boolean;
    is_active?: boolean;
    is_superuser?: boolean;
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

// Filter Types
export interface AdminFilters {
    search?: string;
    is_active?: boolean;
    is_superuser?: boolean;
    roles?: string[];
    [key: string]: string | number | boolean | string[] | undefined;
}

// Table Column Types
export interface AdminTableData extends AdminWithProfile {
    // Additional fields for table display
    role_count: number;
    permission_count: number;
}

// Form Types
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