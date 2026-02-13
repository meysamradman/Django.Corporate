import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapComponent, MapTypes } from "@neshan-maps-platform/mapbox-gl-react";
import nmp_mapboxgl from "@neshan-maps-platform/mapbox-gl";
import "@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css";
import type { MapProviderProps } from "@/types/real_estate/map";

export default function NeshanMapProvider({
    latitude,
    longitude,
    mapCenter,
    mapZoom,
    onLocationChange,
    disabled,
    setIsMapReady,
    apiKey,
}: MapProviderProps) {
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [mapReadyVersion, setMapReadyVersion] = useState(0);

    const hasApiKey = !!apiKey && apiKey.trim().length > 0;

    const mapOptions = useMemo(() => ({
        mapKey: apiKey || "",
        mapType: MapTypes.neshanVector,
        center: [mapCenter[1], mapCenter[0]] as [number, number],
        zoom: mapZoom,
        poi: true,
        traffic: false,
    }), [apiKey, mapCenter, mapZoom]);

    const syncMarker = useCallback((lat: number, lng: number) => {
        const map = mapRef.current;
        if (!map) return;

        const lngLat: [number, number] = [lng, lat];

        if (!markerRef.current) {
            markerRef.current = new nmp_mapboxgl.Marker({ draggable: !disabled })
                .setLngLat(lngLat)
                .addTo(map);

            markerRef.current.on("dragend", () => {
                const pos = markerRef.current?.getLngLat?.();
                if (pos && typeof pos.lat === "number" && typeof pos.lng === "number") {
                    onLocationChange(pos.lat, pos.lng);
                }
            });
        } else {
            markerRef.current.setLngLat(lngLat);
            markerRef.current.setDraggable(!disabled);
        }
    }, [disabled, onLocationChange]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !hasApiKey) return;

        const handleClick = (event: any) => {
            if (disabled) return;
            const lng = event?.lngLat?.lng;
            const lat = event?.lngLat?.lat;
            if (typeof lat === "number" && typeof lng === "number") {
                syncMarker(lat, lng);
                onLocationChange(lat, lng);
            }
        };

        map.on("click", handleClick);

        return () => {
            map.off("click", handleClick);
        };
    }, [disabled, onLocationChange, hasApiKey, syncMarker, mapReadyVersion]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !hasApiKey) return;

        const canvas = map.getCanvas?.();
        if (canvas) {
            canvas.style.cursor = disabled ? "not-allowed" : "grab";
        }

        const interactionHandlers = [
            "dragPan",
            "scrollZoom",
            "boxZoom",
            "doubleClickZoom",
            "keyboard",
            "touchZoomRotate",
        ];

        interactionHandlers.forEach((handlerName) => {
            const handler = (map as any)?.[handlerName];
            if (handler?.enable && handler?.disable) {
                if (disabled) {
                    handler.disable();
                } else {
                    handler.enable();
                }
            }
        });
    }, [disabled, hasApiKey, mapReadyVersion]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !hasApiKey) return;

        if (typeof latitude === "number" && typeof longitude === "number") {
            const lngLat: [number, number] = [longitude, latitude];

            syncMarker(latitude, longitude);

            map.flyTo({ center: lngLat, zoom: Math.max(mapZoom, 14), essential: false });
        } else if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
    }, [latitude, longitude, hasApiKey, mapZoom, syncMarker, mapReadyVersion]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !hasApiKey) return;

        const center: [number, number] = [mapCenter[1], mapCenter[0]];
        map.resize();
        map.flyTo({ center, zoom: mapZoom, essential: false });
    }, [mapCenter, mapZoom, hasApiKey]);

    useEffect(() => {
        return () => {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
        };
    }, []);

    if (!hasApiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-center p-8">
                <h3 className="text-lg font-semibold mb-2">Neshan Map Key تنظیم نشده</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    برای استفاده از نقشه نشان، مقدار کلید را در تنظیمات نقشه پنل یا متغیر VITE_NESHAN_MAP_KEY وارد کنید.
                </p>
            </div>
        );
    }

    return (
        <MapComponent
            options={mapOptions}
            mapSetter={(map: any) => {
                mapRef.current = map;
                setMapReadyVersion((value) => value + 1);
                setIsMapReady(true);
            }}
            className="h-full w-full"
            style={{ height: "100%", width: "100%" }}
        />
    );
}
