import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapProviderProps } from "@/types/real_estate/map";

const createCustomIcon = (isSelected: boolean) => {
    const color = isSelected ? "#3b82f6" : "#94A3B8";

    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
      </filter>
      <path 
        d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" 
        fill="${color}" 
        stroke="white" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        style="filter: url(#shadow);"
      />
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `;

    return L.divIcon({
        className: "custom-map-marker",
        html: `<div style="transform: translate(-50%, -100%); width: 48px; height: 48px;">${svgIcon}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
            map.invalidateSize();
            map.setView(center, zoom, { animate: true, duration: 0.5 });
        }
    }, [map, center[0], center[1], zoom]);
    return null;
}

function MapClickHandler({ onMapClick, disabled }: { onMapClick: (lat: number, lng: number) => void; disabled?: boolean }) {
    useMapEvents({
        click(e) {
            if (!disabled) {
                const { lat, lng } = e.latlng;
                onMapClick(lat, lng);
            }
        },
    });
    return null;
}

function LocationMarker({ position, onPositionChange, disabled }: { position: [number, number] | null; onPositionChange: (lat: number, lng: number) => void; disabled?: boolean }) {
    const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position);
    useEffect(() => { setMarkerPosition(position); }, [position]);
    if (!markerPosition) return null;
    return (
        <Marker
            position={markerPosition}
            icon={createCustomIcon(true)}
            draggable={!disabled}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setMarkerPosition([pos.lat, pos.lng]);
                    onPositionChange(pos.lat, pos.lng);
                },
            }}
        />
    );
}

export default function LeafletMapProvider({
    latitude,
    longitude,
    mapCenter,
    mapZoom,
    onLocationChange,
    disabled,
    setIsMapReady
}: MapProviderProps) {
    return (
        <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            scrollWheelZoom={!disabled}
            className="z-0"
            whenReady={() => {
                setTimeout(() => setIsMapReady(true), 100);
            }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={onLocationChange} disabled={disabled} />
            <LocationMarker
                position={latitude && longitude ? [latitude, longitude] : null}
                onPositionChange={onLocationChange}
                disabled={disabled}
            />
        </MapContainer>
    );
}
