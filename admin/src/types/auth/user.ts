import { Media } from "@/types/shared/media";
import { Base } from "@/types/shared/base";
import { ProvinceCompact, CityCompact } from "@/types/shared/location";

export interface User extends Base {
    mobile: string;
    email: string | null;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    user_type: string;
    full_name: string;
}

export interface UserProfile extends Base {
    first_name: string;
    last_name: string;
    full_name: string;
    national_id: string | null;
    birth_date: string | null;
    address: string | null;
    phone: string | null;  // ✅ فیلد جدید
    province: ProvinceCompact | null;  // ✅ فیلد جدید
    city: CityCompact | null;  // ✅ فیلد جدید
    bio: string | null;
    profile_picture: Media | null;
}



export interface UserWithProfile extends Base {
    mobile: string;
    email: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    user_type: string;
    profile?: UserProfile;
    permissions?: string[];
    roles?: Array<{
        id: number;
        name: string;
    }>;
    password?: string;
    identifier?: string;
    role_id?: number | string | null;
    full_name?: string;
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
