import { Base } from "@/types/shared/base";

// Province interface
export interface Province extends Base {
    name: string;
    code: string;
    is_active: boolean;
}

// City interface
export interface City extends Base {
    name: string;
    code: string;
    province_name: string;
    full_name: string;
    is_active: boolean;
}

// Province with cities count (for admin panel)
export interface ProvinceWithStats extends Province {
    cities_count: number;
}

// City with province data
export interface CityWithProvince extends Base {
    name: string;
    code: string;
    province: Province;
    full_name: string;
    is_active: boolean;
}

// Location API types
export interface LocationListParams {
    search?: string;
    page?: number;
    size?: number;
    province_id?: number;
    is_active?: boolean;
}

// Compact versions for use in profiles
export interface ProvinceCompact {
    id: number;
    name: string;
    code: string;
}

export interface CityCompact {
    id: number;
    name: string;
    code: string;
    province_name: string;
}