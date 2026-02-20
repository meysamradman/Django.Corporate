import type { Base } from "@/types/shared/base";

export interface RealEstateProvince extends Base {
    name: string;
    code: string;
    country_name: string;
    cities_count?: number;
    latitude?: number;
    longitude?: number;
    is_active: boolean;
}

export interface RealEstateCity extends Base {
    name: string;
    code: string;
    province_id: number;
    province_name: string;
    has_regions?: boolean;
    property_count?: number;
    latitude?: number;
    longitude?: number;
    is_active: boolean;
}

export interface RealEstateCityRegion extends Base {
    name: string;
    code: number;
    city_id: number;
    city_name: string;
    province_id: number;
    province_name: string;
    is_active: boolean;
}

