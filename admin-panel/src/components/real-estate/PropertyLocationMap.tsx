import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2 } from "lucide-react";
import { Label } from "@/components/elements/Label";
import { realEstateApi } from "@/api/real-estate";
import { showError, showSuccess } from "@/core/toast";

// Province coordinates for Iran (approximate centers)
const IRAN_PROVINCE_COORDINATES: Record<string, [number, number]> = {
  'تهران': [35.6892, 51.3890],
  'اصفهان': [32.6546, 51.6680],
  'خراسان رضوی': [36.2605, 59.6168],
  'فارس': [29.5918, 52.5837],
  'آذربایجان شرقی': [38.0806, 46.2911],
  'قم': [34.6401, 50.8769],
  'خوزستان': [31.3183, 48.6706],
  'کرمانشاه': [34.3142, 47.0650],
  'گیلان': [37.2808, 49.5832],
  'آذربایجان غربی': [37.5527, 45.0759],
  'یزد': [31.8974, 54.3569],
  'کرمان': [30.2839, 57.0834],
  'همدان': [34.7983, 48.5148],
  'اردبیل': [38.2498, 48.2967],
  'هرمزگان': [27.1833, 56.2667],
  'سیستان و بلوچستان': [29.4960, 60.8629],
  'گلستان': [36.8427, 54.4319],
  'مازندران': [36.5633, 53.0601],
  'قزوین': [36.2797, 50.0049],
  'کردستان': [35.3144, 46.9983],
  'لرستان': [33.4878, 48.3558],
  'مرکزی': [34.0809, 49.7012],
  'بوشهر': [28.9234, 50.8203],
  'چهارمحال و بختیاری': [32.3266, 50.8546],
  'سمنان': [35.5728, 53.3971],
  'زنجان': [36.5010, 48.4789],
  'ایلام': [33.2958, 46.6707],
  'کهگیلویه و بویراحمد': [30.6627, 51.5950],
  'البرز': [35.8327, 50.9345],
  'خراسان شمالی': [37.4710, 57.1013],
  'خراسان جنوبی': [32.8649, 59.2262],
};

// City coordinates for Iran (approximate centers)
const IRAN_CITY_COORDINATES: Record<string, [number, number]> = {
  'تهران': [35.6892, 51.3890],
  'اصفهان': [32.6546, 51.6680],
  'مشهد': [36.2605, 59.6168],
  'شیراز': [29.5918, 52.5837],
  'تبریز': [38.0806, 46.2911],
  'قم': [34.6401, 50.8769],
  'اهواز': [31.3183, 48.6706],
  'کرمانشاه': [34.3142, 47.0650],
  'رشت': [37.2808, 49.5832],
  'ارومیه': [37.5527, 45.0759],
  'یزد': [31.8974, 54.3569],
  'کرمان': [30.2839, 57.0834],
  'همدان': [34.7983, 48.5148],
  'اردبیل': [38.2498, 48.2967],
  'بندرعباس': [27.1833, 56.2667],
  'زاهدان': [29.4960, 60.8629],
  'گرگان': [36.8427, 54.4319],
  'ساری': [36.5633, 53.0601],
  'قزوین': [36.2797, 50.0049],
  'سنندج': [35.3144, 46.9983],
};

// Fix for default marker icon in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const createCustomIcon = (isSelected: boolean) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${isSelected ? "#3b82f6" : "#ef4444"};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 18px;
          font-weight: bold;
        ">📍</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
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
    if (center && Array.isArray(center) && center.length === 2 && 
        !isNaN(center[0]) && !isNaN(center[1]) && 
        isFinite(center[0]) && isFinite(center[1])) {
      // تابع برای به‌روزرسانی نقشه
      const updateMapView = () => {
        try {
          if (map && typeof map.setView === 'function') {
            map.setView(center, zoom, {
              animate: true,
              duration: 0.5
            });
            return true;
          }
        } catch (error) {
          console.warn("Error updating map view:", error);
        }
        return false;
      };
      
      // تلاش فوری برای به‌روزرسانی
      if (!updateMapView()) {
        // اگر نقشه آماده نبود، کمی صبر می‌کنیم
        const timer1 = setTimeout(() => {
          if (!updateMapView()) {
            // تلاش نهایی
            const timer2 = setTimeout(updateMapView, 200);
            return () => clearTimeout(timer2);
          }
        }, 50);
        
        return () => clearTimeout(timer1);
      }
    }
  }, [map, center, zoom]);
  
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
  onLocationChange: (lat: number, lng: number) => void;
  onAddressUpdate?: (address: string) => void;
  onNeighborhoodUpdate?: (neighborhood: string) => void;
  onRegionUpdate?: (regionId: number) => void;
  cityId?: number | null;
  cityName?: string | null;
  provinceName?: string | null;
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
  cityId,
  cityName,
  provinceName,
  disabled = false,
  className = "",
}: PropertyLocationMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6892, 51.3890]); // Tehran, Iran
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Set initial center based on coordinates, city, or province
  // Priority: 1) coordinates (if exists), 2) city, 3) province
  // اما اگر استان یا شهر تغییر کرد، نقشه را به‌روز می‌کنیم
  useEffect(() => {
    // اگر شهر انتخاب شده، نقشه را به مرکز شهر می‌بریم (اولویت بالاتر از مختصات)
    if (cityName) {
      const cityCoords = IRAN_CITY_COORDINATES[cityName];
      if (cityCoords) {
        setMapCenter(cityCoords);
        setMapZoom(12);
        return; // اگر شهر انتخاب شده، از آن استفاده می‌کنیم
      }
    }
    
    // اگر فقط استان انتخاب شده، نقشه را به مرکز استان می‌بریم
    if (provinceName) {
      const provinceCoords = IRAN_PROVINCE_COORDINATES[provinceName];
      if (provinceCoords) {
        setMapCenter(provinceCoords);
        setMapZoom(8);
        return; // اگر استان انتخاب شده، از آن استفاده می‌کنیم
      }
    }
    
    // اگر مختصات دقیق داریم و شهر/استان انتخاب نشده، از مختصات استفاده می‌کنیم
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
      setMapZoom(15);
    } 
    // پیش‌فرض: تهران
    else {
      setMapCenter([35.6892, 51.3890]); // Default to Tehran
      setMapZoom(6);
    }
  }, [latitude, longitude, cityName, provinceName]);

  // Fetch Nominatim reverse geocoding to get address string
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

    // Priority order: City -> Province -> Country -> District/Region -> Neighborhood -> Street
    // Start with city, then remove country for cleaner display

    // City (شهر) - FIRST
    if (addr.city || addr.town || addr.village) {
      const city = addr.city || addr.town || addr.village;
      // Clean city name - remove duplicates like "شهر تهران" if city is already "تهران"
      let cleanCity = city;
      if (city.includes('شهر تهران') && cityName === 'تهران') {
        cleanCity = city.replace(/\s*شهر\s+تهران\s*/gi, '').trim();
      }
      parts.push(cleanCity);
    }

    // Province (استان) - Only add if different from city
    if (addr.state) {
      // Remove "استان" prefix if exists and add it back
      const province = addr.state.replace(/^استان\s+/, '').replace(/^استان\s+/, '');
      const provinceText = `استان ${province}`;

      // Don't add province if it's the same as city (like تهران)
      if (province !== 'تهران' || !parts.includes('تهران')) {
        parts.push(provinceText);
      }
    }

    // Country (ایران) - Skip for cleaner display
    // if (addr.country) {
    //   parts.push(addr.country);
    // }

    // District/Region (منطقه)
    if (addr.suburb || addr.neighbourhood || addr.city_district) {
      let district = addr.suburb || addr.neighbourhood || addr.city_district;

      // Clean up duplicates for Tehran
      if (cityName === 'تهران') {
        // Remove "شهر تهران" from district if present
        district = district.replace(/\s*شهر\s+تهران\s*/gi, '').trim();
        district = district.replace(/\s*تهران\s*/gi, '').trim();

        // Try to extract region number
        if (district.includes('منطقه')) {
          const regionMatch = district.match(/منطقه\s+(\d+)/i);
          if (regionMatch) {
            district = `منطقه ${regionMatch[1]}`;
          }
        }
      }

      // Only add district if it's not empty after cleaning
      if (district.trim()) {
        parts.push(district);
      }
    }

    // Neighborhood/Local area (محله/ناحیه)
    if (addr.locality || addr.hamlet) {
      parts.push(addr.locality || addr.hamlet);
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

    // If we have formatted parts, use them; otherwise fall back to display_name
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

          console.log('📍 All address parts:', addressParts);
          console.log('🎯 Extracted neighborhood:', extractedNeighborhood);

          // Try to detect region for Tehran based on coordinates and address
          if (cityName === 'تهران' && onRegionUpdate && address) {
            console.log('🔍 Starting region detection for Tehran...');
            console.log('📍 Address:', address);

            let detectedRegion: number | null = null;

            // Simple region detection
            if (address.includes('منطقه ۱۱')) {
              detectedRegion = 11;
            } else if (address.includes('منطقه ۶') || address.includes('دانشگاه')) {
              detectedRegion = 6;
            } else {
              detectedRegion = 11; // Default for Tehran
            }

            if (detectedRegion && detectedRegion >= 1 && detectedRegion <= 22) {
              onRegionUpdate(detectedRegion);
              console.log('Final detected region:', detectedRegion);
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

