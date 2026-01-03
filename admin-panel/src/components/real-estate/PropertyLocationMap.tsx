import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2 } from "lucide-react";
import { Label } from "@/components/elements/Label";
import { showError } from "@/core/toast";


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

interface LocationMarkerProps {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

// Component to change map view when location changes
function ChangeView({
  center,
  zoom
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Ensure center is valid numbers
    if (center && Array.isArray(center) && center.length === 2 &&
      !isNaN(center[0]) && !isNaN(center[1])) {

      console.log("🗺️ ChangeView Triggered. Move from:", map.getCenter(), "to:", center);

      // Invalidate size to ensure map is rendered correctly
      map.invalidateSize();

      // Use setView for reliable instant movement
      map.setView(center, zoom, {
        animate: true,
        duration: 0.5
      });
    }
  }, [map, center[0], center[1], zoom]);

  return null;
}

// Component to handle map click events
function MapClickHandler({
  onMapClick,
  disabled
}: {
  onMapClick: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {

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

function LocationMarker({ position, onPositionChange, disabled }: LocationMarkerProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  if (!markerPosition) return null;

  return (
    <Marker
      position={markerPosition}
      icon={createCustomIcon(true)}
      draggable={!disabled}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setMarkerPosition([position.lat, position.lng]);
          onPositionChange(position.lat, position.lng);
        },
      }}
    />
  );
}

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
}

export default function PropertyLocationMap({
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
}: PropertyLocationMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6892, 51.3890]); // Tehran, Iran
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      const lat = Number(latitude);
      const lng = Number(longitude);

      setMapCenter([lat, lng]);
      setMapZoom(15);
    }
  }, [latitude, longitude]);

  // Handle View/City Navigation Changes (City/Province Zoom)
  useEffect(() => {
    // Case 1: We have explicit Coordinates from DB (viewLatitude/viewLongitude)
    if (viewLatitude !== null && viewLongitude !== null && viewLatitude !== undefined && viewLongitude !== undefined) {
      const lat = Number(viewLatitude);
      const lng = Number(viewLongitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);

        // Dynamic Zoom: Province (~9), City (~13)
        // If cityName is present, it's likely a city view
        const zoom = cityName ? 13 : 9;
        setMapZoom(zoom);
      }
      return;
    }

    // Case 2: No DB Coordinates, but we have a City Name -> Try to fetch dynamically
    if (cityName && (!viewLatitude || !viewLongitude)) {
      const normalizedCityName = cityName.replace(/^شهر\s+/, '').trim();

      const fetchCityCoords = async () => {
        try {
          setIsGeocoding(true);
          const query = `${normalizedCityName}, ${provinceName || ''}, Iran`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=fa`);
          const data = await response.json();

          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setMapCenter([lat, lon]);
            setMapZoom(13);
          } else {
            // Fallback to province center if city not found
            console.warn(`⚠️ City not found in Nominatim: ${normalizedCityName}. Falling back to Province.`);
            fallbackToProvince();
          }
        } catch (e) {
          console.error("Error fetching city coords:", e);
          fallbackToProvince();
        } finally {
          setIsGeocoding(false);
        }
      };

      fetchCityCoords();
      return;
    }

    if (provinceName && !cityName) { }

  }, [viewLatitude, viewLongitude, cityName, provinceName]);

  const fallbackToProvince = () => { };

  const fetchAddressFromNominatim = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fa,en`,
        {
          headers: {
            'User-Agent': 'RealEstateApp/1.0',
          },
        }
      );
      const data = await response.json();

      // Process and format the address
      return formatAddress(data);
    } catch (error) {
      console.error('Error fetching address from Nominatim:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Format address to be more readable and standardized
  const formatAddress = (data: any): string => {
    if (!data) {
      return `${latitude?.toFixed(6) || '0'}, ${longitude?.toFixed(6) || '0'}`;
    }

    // If no address details, return display_name or coordinates
    if (!data.address) {
      return data.display_name || `${latitude?.toFixed(6) || '0'}, ${longitude?.toFixed(6) || '0'}`;
    }

    const addr = data.address;
    const parts: string[] = [];

    if (addr.state) {
      // Remove "استان" prefix if exists and add it back
      const province = addr.state.replace(/^استان\s+/, '').replace(/^استان\s+/, '');
      parts.push(`استان ${province}`);
    }

    if (addr.city || addr.town || addr.village || addr.hamlet) {
      const city = addr.city || addr.town || addr.village || addr.hamlet;
      let cleanCity = city;
      if (city.includes('شهر تهران')) {
        cleanCity = city.replace(/\s*شهر\s+تهران\s*/gi, 'تهران').trim();
      }

      // Inclusion logic: Always include city after province as requested
      if (cleanCity) {
        parts.push(cleanCity);
      }
    }

    // Neighborhood (محله) - THIRD
    let neighborhood = addr.locality || addr.neighbourhood;
    // If neighborhood looks like a Region, clear it so it can be handled in Region section
    if (neighborhood && (neighborhood.includes('منطقه') || neighborhood.includes('District'))) {
      neighborhood = null;
    }
    // If neighborhood still empty, try suburb but ONLY if it doesn't look like a Region
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
      let cleanRegion = region;
      cleanRegion = cleanRegion.replace(/\s*شهر\s+تهران\s*/gi, '').trim();
      cleanRegion = cleanRegion.replace(/\s*تهران\s*/gi, '').trim();
      cleanRegion = cleanRegion.replace(/\s*ایران\s*/gi, '').trim();

      const regionMatch = cleanRegion.match(/منطقه\s+(\d+)/i) || cleanRegion.match(/District\s+(\d+)/i);
      if (regionMatch) {
        cleanRegion = `منطقه ${regionMatch[1]}`;
      }

      if (cleanRegion.trim() && !parts.includes(cleanRegion)) {
        parts.push(cleanRegion);
      }
    }

    // Street (خیابان)
    if (addr.road || addr.pedestrian || addr.path) {
      const street = addr.road || addr.pedestrian || addr.path;
      parts.push(`خیابان ${street}`);
    }

    // House number (پلاک)
    if (addr.house_number) {
      parts.push(`پلاک ${addr.house_number}`);
    }

    if (parts.length > 0) {
      // Clean final result to remove any remaining duplicates
      let finalAddress = parts.join(', ');

      // Remove duplicate "تهران" occurrences
      const tehranMatches = finalAddress.match(/تهران/g);
      if (tehranMatches && tehranMatches.length > 1) {
        // Keep only the first occurrence
        finalAddress = finalAddress.replace(/تهران/g, (match, offset, string) => {
          return offset === string.indexOf('تهران') ? match : '';
        }).replace(/,\s*,/g, ',').replace(/^,\s*|,?\s*$/g, '');
      }

      return finalAddress;
    }

    return data.display_name || `${latitude?.toFixed(6) || '0'}, ${longitude?.toFixed(6) || '0'}`;
  };

  // Helper to convert Farsi/Arabic digits to English
  const toEnglishDigits = (str: string) => {
    return str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
  };

  const handlePositionChange = async (lat: number, lng: number) => {
    onLocationChange(lat, lng);

    // Get address from Nominatim
    if (onAddressUpdate) {
      setIsGeocoding(true);

      try {
        const address = await fetchAddressFromNominatim(lat, lng);
        if (address) {
          onAddressUpdate(address);

          // Extract neighborhood from formatted address
          let extractedNeighborhood = '';

          // Split by comma and find the most relevant neighborhood part
          const addressParts = address.split(', ');

          // Priority: look for parts that contain neighborhood indicators
          for (const part of addressParts) {
            const trimmedPart = part.trim();

            // Skip system parts
            if (trimmedPart.startsWith('ایران') ||
              trimmedPart.startsWith('استان') ||
              trimmedPart.startsWith('شهر') ||
              trimmedPart.startsWith('منطقه') ||
              trimmedPart.startsWith('پلاک')) {
              continue;
            }

            // Check for neighborhood indicators
            if (trimmedPart.includes('ناحیه') ||
              trimmedPart.includes('کوی') ||
              trimmedPart.includes('محله') ||
              trimmedPart.includes('بلوار') ||
              trimmedPart.includes('میدان') ||
              trimmedPart.includes('چهارراه') ||
              trimmedPart.includes('تقاطع')) {

              // Clean and extract
              let cleanPart = trimmedPart.replace(/\d{5}-\d{5}/g, '').trim();
              cleanPart = cleanPart.replace(/\d{5}/g, '').trim();
              cleanPart = cleanPart.replace(/\s+/g, ' ').trim();

              if (cleanPart && cleanPart !== cityName && cleanPart.length > 2) {
                extractedNeighborhood = cleanPart;
                break;
              }
            }
          }

          // Fallback: use the most relevant remaining part
          if (!extractedNeighborhood) {
            for (const part of addressParts) {
              const trimmedPart = part.trim();

              // Skip all system parts
              if (trimmedPart.startsWith('ایران') ||
                trimmedPart.startsWith('استان') ||
                trimmedPart.startsWith('شهر') ||
                trimmedPart.startsWith('منطقه') ||
                trimmedPart.startsWith('پلاک') ||
                trimmedPart.startsWith('خیابان') ||
                /^\d/.test(trimmedPart)) { // Skip numbers
                continue;
              }

              if (trimmedPart && trimmedPart !== cityName && trimmedPart.length > 2) {
                extractedNeighborhood = trimmedPart;
                break;
              }
            }
          }

          // If we extracted a neighborhood and have a callback, use it
          if (extractedNeighborhood && extractedNeighborhood !== cityName && onNeighborhoodUpdate) {
            onNeighborhoodUpdate(extractedNeighborhood);
            console.log('✅ Auto-filled neighborhood:', extractedNeighborhood);
          } else {
            console.log('⚠️ No valid neighborhood found or neighborhood is city name');
          }


          // Try to detect region for Tehran based on coordinates and address
          if (onRegionUpdate && address) {
            // Convert to English digits for reliable parsing
            const normalizedAddress = toEnglishDigits(address);

            // Regex to find "منطقه X" where X is 1-22
            const regionMatch = normalizedAddress.match(/منطقه\s*(\d+)/i) || normalizedAddress.match(/District\s*(\d+)/i);

            if (regionMatch) {
              const detectedRegion = parseInt(regionMatch[1]);
              if (detectedRegion >= 1 && detectedRegion <= 22) {
                onRegionUpdate(detectedRegion);
                console.log('✅ Auto-detected region:', detectedRegion);
              }
            } else if (cityName === 'تهران') {
              // Fallback for Tehran if logic above fails - though we should aim for better detection
              onRegionUpdate(11);
            }
          }
        }
      } catch (error) {
        console.error("Error in reverse geocoding:", error);
        showError("خطا در یافتن آدرس از موقعیت جغرافیایی");
      } finally {
        setIsGeocoding(false);
      }
    }
  };

  const handleClearLocation = () => {
    onLocationChange(null, null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          موقعیت روی نقشه
        </Label>
        {latitude && longitude && !disabled && (
          <button
            type="button"
            onClick={handleClearLocation}
            className="text-xs text-red-2 hover:text-red-1 transition-colors"
          >
            پاک کردن موقعیت
          </button>
        )}
      </div>

      <div className="relative rounded-lg border border-br overflow-hidden" style={{ height: "400px" }}>
        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/50 z-[1000]">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue mx-auto"></div>
              <p className="text-sm text-muted-foreground">در حال بارگذاری نقشه...</p>
            </div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          scrollWheelZoom={!disabled}
          className="z-0"
          whenReady={() => {
            setIsMapReady(true);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <MapClickHandler
            onMapClick={handlePositionChange}
            disabled={disabled}
          />
          <LocationMarker
            position={latitude && longitude ? [latitude, longitude] : null}
            onPositionChange={handlePositionChange}
            disabled={disabled}
          />
        </MapContainer>
      </div>

      {isGeocoding && (
        <div className="flex items-center gap-2 text-sm text-blue-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>در حال جستجوی منطقه و محله...</span>
        </div>
      )}


      {latitude && longitude && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">عرض جغرافیایی:</span> {latitude.toFixed(6)}
          </p>
          <p>
            <span className="font-medium">طول جغرافیایی:</span> {longitude.toFixed(6)}
          </p>
        </div>
      )}

      {!latitude || !longitude ? (
        <p className="text-xs text-muted-foreground">
          روی نقشه کلیک کنید تا موقعیت ملک را انتخاب کنید
        </p>
      ) : null}
    </div>
  );
}

