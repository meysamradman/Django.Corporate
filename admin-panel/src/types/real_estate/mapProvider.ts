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
}

export type MapProviderType = 'leaflet' | 'google_maps' | 'neshan' | 'cedarmaps';
