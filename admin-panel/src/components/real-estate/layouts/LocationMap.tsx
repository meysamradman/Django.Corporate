import { useEffect, useState, lazy, Suspense } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Label } from "@/components/elements/Label";
import { showError } from "@/core/toast";
import { settingsApi } from "@/api/settings/settings";
import type { MapSettings } from "@/types/real_estate/map";

// Dynamic Providers
const LeafletMapProvider = lazy(() => import("./maps/LeafletMapProvider"));
const GoogleMapProvider = lazy(() => import("./maps/GoogleMapProvider"));

interface PropertyLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  onAddressUpdate?: (address: string) => void;
  onNeighborhoodUpdate?: (neighborhood: string) => void;
  onRegionUpdate?: (regionId: number) => void;
  cityName?: string | null;
  provinceName?: string | null;
  viewLatitude?: number | null;
  viewLongitude?: number | null;
  disabled?: boolean;
  className?: string;
  minimal?: boolean;
}

export default function LocationMap({
  latitude,
  longitude,
  onLocationChange,
  onAddressUpdate,
  onNeighborhoodUpdate,
  onRegionUpdate,
  cityName,
  provinceName,
  viewLatitude,
  viewLongitude,
  disabled = false,
  className = "",
  minimal = false,
}: PropertyLocationMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6892, 51.3890]);
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapSettings, setMapSettings] = useState<MapSettings | null>(null);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.getMapSettings();
        setMapSettings(settings);
      } catch (error) {
        setMapSettings({ provider: 'leaflet' } as MapSettings);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setMapCenter([Number(latitude), Number(longitude)]);
      setMapZoom(15);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (viewLatitude !== null && viewLongitude !== null && viewLatitude !== undefined && viewLongitude !== undefined) {
      const lat = Number(viewLatitude);
      const lng = Number(viewLongitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(cityName ? 13 : 9);
      }
      return;
    }

    if (cityName && (!viewLatitude || !viewLongitude)) {
      const normalizedCityName = cityName.replace(/^شهر\s+/, '').trim();
      const fetchCityCoords = async () => {
        try {
          setIsGeocoding(true);
          const query = `${normalizedCityName}, ${provinceName || ''}, Iran`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=fa`);
          const data = await response.json();
          if (data && data.length > 0) {
            setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            setMapZoom(13);
          }
        } catch (e) {
          console.error("Geocoding failed", e);
        } finally {
          setIsGeocoding(false);
        }
      };
      fetchCityCoords();
    }
  }, [viewLatitude, viewLongitude, cityName, provinceName]);

  const formatAddress = (data: any): string => {
    if (!data) return `${latitude?.toFixed(6) || '0'}, ${longitude?.toFixed(6) || '0'}`;
    if (!data.address) return data.display_name || `${latitude?.toFixed(6) || '0'}, ${longitude?.toFixed(6) || '0'}`;

    const addr = data.address;
    const parts: string[] = [];

    if (addr.state) {
      const province = addr.state.replace(/^استان\s+/, '').trim();
      parts.push(`استان ${province}`);
    }

    if (addr.city || addr.town || addr.village || addr.hamlet) {
      const city = addr.city || addr.town || addr.village || addr.hamlet;
      let cleanCity = city;
      if (city.includes('شهر تهران')) {
        cleanCity = city.replace(/\s*شهر\s+تهران\s*/gi, 'تهران').trim();
      }
      if (cleanCity) parts.push(cleanCity);
    }

    let neighborhood = addr.locality || addr.neighbourhood;
    if (neighborhood && (neighborhood.includes('منطقه') || neighborhood.includes('District'))) {
      neighborhood = null;
    }
    if (!neighborhood && addr.suburb && !addr.suburb.includes('منطقه') && !addr.suburb.includes('District')) {
      neighborhood = addr.suburb;
    }

    if (neighborhood && !parts.includes(neighborhood)) {
      parts.push(neighborhood);
    }

    let region = addr.city_district || '';
    if (!region.includes('منطقه') && !region.includes('District')) {
      if (addr.suburb && (addr.suburb.includes('منطقه') || addr.suburb.includes('District'))) {
        region = addr.suburb;
      } else if (addr.neighbourhood && (addr.neighbourhood.includes('منطقه') || addr.neighbourhood.includes('District'))) {
        region = addr.neighbourhood;
      }
    }

    if (region) {
      let cleanRegion = region.replace(/\s*شهر\s+تهران\s*/gi, '').replace(/\s*تهران\s*/gi, '').replace(/\s*ایران\s*/gi, '').trim();
      const regionMatch = cleanRegion.match(/منطقه\s+(\d+)/i) || cleanRegion.match(/District\s+(\d+)/i);
      if (regionMatch) cleanRegion = `منطقه ${regionMatch[1]}`;
      if (cleanRegion && !parts.includes(cleanRegion)) parts.push(cleanRegion);
    }

    if (addr.road || addr.pedestrian || addr.path) {
      const street = addr.road || addr.pedestrian || addr.path;
      parts.push(`خیابان ${street}`);
    }

    if (addr.house_number) parts.push(`پلاک ${addr.house_number}`);

    if (parts.length > 0) {
      let finalAddress = parts.join(', ');
      const tehranMatches = finalAddress.match(/تهران/g);
      if (tehranMatches && tehranMatches.length > 1) {
        finalAddress = finalAddress.replace(/تهران/g, (match, offset, string) => {
          return offset === string.indexOf('تهران') ? match : '';
        }).replace(/,\s*,/g, ',').replace(/^,\s*|,?\s*$/g, '');
      }
      return finalAddress;
    }

    return data.display_name || `${latitude?.toFixed(6) || '0'}, ${longitude?.toFixed(6) || '0'}`;
  };

  const toEnglishDigits = (str: string) => {
    return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  };

  const handlePositionChange = async (lat: number, lng: number) => {
    onLocationChange(lat, lng);
    if (!onAddressUpdate) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fa,en`,
        { headers: { 'User-Agent': 'RealEstateApp/1.0' } }
      );
      const data = await response.json();

      const address = formatAddress(data);
      if (address) {
        onAddressUpdate(address);

        let extractedNeighborhood = '';
        const addressParts = address.split(', ');

        for (const part of addressParts) {
          const trimmedPart = part.trim();
          if (trimmedPart.startsWith('ایران') || trimmedPart.startsWith('استان') || trimmedPart.startsWith('شهر') || trimmedPart.startsWith('منطقه') || trimmedPart.startsWith('پلاک')) continue;
          if (trimmedPart.includes('ناحیه') || trimmedPart.includes('کوی') || trimmedPart.includes('محله') || trimmedPart.includes('بلوار') || trimmedPart.includes('میدان')) {
            let cleanPart = trimmedPart.replace(/\d{5}-\d{5}/g, '').replace(/\d{5}/g, '').trim();
            if (cleanPart && cleanPart !== cityName && cleanPart.length > 2) {
              extractedNeighborhood = cleanPart;
              break;
            }
          }
        }

        if (!extractedNeighborhood) {
          for (const part of addressParts) {
            const trimmedPart = part.trim();
            if (trimmedPart.startsWith('ایران') || trimmedPart.startsWith('استان') || trimmedPart.startsWith('شهر') || trimmedPart.startsWith('منطقه') || trimmedPart.startsWith('پلاک') || trimmedPart.startsWith('خیابان') || /^\d/.test(trimmedPart)) continue;
            if (trimmedPart && trimmedPart !== cityName && trimmedPart.length > 2) {
              extractedNeighborhood = trimmedPart;
              break;
            }
          }
        }

        if (extractedNeighborhood && extractedNeighborhood !== cityName && onNeighborhoodUpdate) {
          onNeighborhoodUpdate(extractedNeighborhood);
        }

        if (onRegionUpdate) {
          const normalizedAddress = toEnglishDigits(address);
          const regionMatch = normalizedAddress.match(/منطقه\s*(\d+)/i) || normalizedAddress.match(/District\s*(\d+)/i);
          if (regionMatch) {
            const detectedRegion = parseInt(regionMatch[1]);
            if (detectedRegion >= 1 && detectedRegion <= 22) onRegionUpdate(detectedRegion);
          } else if (cityName === 'تهران') {
            onRegionUpdate(11);
          }
        }
      }
    } catch (error) {
      showError("خطا در یافتن آدرس");
    } finally {
      setIsGeocoding(false);
    }
  };

  if (!mapSettings) return <div className="h-[400px] flex items-center justify-center bg-muted/10"><Loader2 className="animate-spin" /></div>;

  const provider = mapSettings.provider;

  return (
    <div className={`space-y-2 ${className}`}>
      {!minimal && (
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            موقعیت روی نقشه ({provider === 'leaflet' ? 'OSM' : provider === 'google_maps' ? 'Google' : 'بومی'})
          </Label>
          {latitude && longitude && !disabled && (
            <button
              type="button"
              onClick={() => onLocationChange(null, null)}
              className="text-xs text-red-2 hover:text-red-1 transition-colors"
            >
              پاک کردن موقعیت
            </button>
          )}
        </div>
      )}

      <div
        className={`relative overflow-hidden ${minimal ? '' : 'rounded-lg border border-br'}`}
        style={{ height: minimal ? "100%" : "400px" }}
      >
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/50 z-1000">
            <Loader2 className="animate-spin text-blue" />
          </div>
        )}

        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
          {provider === 'leaflet' && (
            <LeafletMapProvider
              latitude={latitude}
              longitude={longitude}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              onLocationChange={handlePositionChange}
              disabled={disabled}
              setIsMapReady={setIsMapReady}
              cityName={cityName}
              provinceName={provinceName}
            />
          )}

          {provider === 'google_maps' && (
            <GoogleMapProvider
              latitude={latitude}
              longitude={longitude}
              mapCenter={mapCenter}
              mapZoom={mapZoom}
              onLocationChange={handlePositionChange}
              disabled={disabled}
              setIsMapReady={setIsMapReady}
              apiKey={mapSettings.configs?.google_maps?.api_key}
              google_maps_map_id={mapSettings.configs?.google_maps?.map_id}
              cityName={cityName}
              provinceName={provinceName}
            />
          )}
        </Suspense>
      </div>

      {isGeocoding && (
        <div className="flex items-center gap-2 text-sm text-blue-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>در حال دریافت اطلاعات موقعیت...</span>
        </div>
      )}
    </div>
  );
}
