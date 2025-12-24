import type { Base } from "@/types/shared/base";

export interface RealEstateProvince extends Base {
    name: string;
    code: string;
    country_name: string;
    is_active: boolean;
}

export interface RealEstateCity extends Base {
    name: string;
    code: string;
    province_id: number;
    province_name: string;
    is_active: boolean;
}

export interface RealEstateDistrict extends Base {
    name: string;
    region_id?: number;
    region_name?: string;
    city_id: number;
    city_name: string;
    province_id: number;
    province_name: string;
    is_active: boolean;
}

