import type { Base } from "@/types/shared/base";

export interface Province extends Base {
    name: string;
    code: string;
    is_active: boolean;
}

export interface City extends Base {
    name: string;
    code: string;
    province_name: string;
    full_name: string;
    is_active: boolean;
}

export interface ProvinceWithStats extends Province {
    cities_count: number;
}

export interface CityWithProvince extends Base {
    name: string;
    code: string;
    province: Province;
    full_name: string;
    is_active: boolean;
}

export interface LocationListParams {
    search?: string;
    page?: number;
    size?: number;
    province_id?: number;
    is_active?: boolean;
}

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