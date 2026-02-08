export type MapProviderType = 'leaflet' | 'google_maps';

export interface MapSettings {
    id: number;
    public_id: string;
    provider: MapProviderType;
    configs: {
        google_maps?: {
            api_key?: string | null;
            map_id?: string | null;
        };
        [key: string]: any;
    };
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface MapProviderProps {
    latitude: number | null;
    longitude: number | null;
    mapCenter: [number, number];
    mapZoom: number;
    onLocationChange: (lat: number, lng: number) => void;
    disabled: boolean;
    setIsMapReady: (ready: boolean) => void;
    cityName?: string | null;
    provinceName?: string | null;
    apiKey?: string | null;
    google_maps_map_id?: string | null;
}
