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
  onLocationChange: (latitude: number | null, longitude: number | null) => void;
  onDistrictChange?: (districtId: number | null, regionName?: string | null, districtName?: string | null) => void;
  cityId?: number | null;
  selectedCityName?: string | null;
  selectedProvinceName?: string | null;
  disabled?: boolean;
  className?: string;
}

export default function PropertyLocationMap({
  latitude,
  longitude,
  onLocationChange,
  onDistrictChange,
  cityId,
  selectedCityName,
  selectedProvinceName,
  disabled = false,
  className = "",
}: PropertyLocationMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.6892, 51.3890]); // Tehran, Iran
  const [mapZoom, setMapZoom] = useState<number>(6);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState<{ id: number; name: string; region_name: string } | null>(null);

  // Set initial center based on coordinates, city, or province
  // Priority: 1) coordinates (if exists), 2) city, 3) province
  // اما اگر استان یا شهر تغییر کرد، نقشه را به‌روز می‌کنیم
  useEffect(() => {
    // اگر شهر انتخاب شده، نقشه را به مرکز شهر می‌بریم (اولویت بالاتر از مختصات)
    if (selectedCityName) {
      const cityCoords = IRAN_CITY_COORDINATES[selectedCityName];
      if (cityCoords) {
        setMapCenter(cityCoords);
        setMapZoom(12);
        return; // اگر شهر انتخاب شده، از آن استفاده می‌کنیم
      }
    }
    
    // اگر فقط استان انتخاب شده، نقشه را به مرکز استان می‌بریم
    if (selectedProvinceName) {
      const provinceCoords = IRAN_PROVINCE_COORDINATES[selectedProvinceName];
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
  }, [latitude, longitude, selectedCityName, selectedProvinceName]);

  // Fetch Nominatim reverse geocoding to get region and district names
  const fetchAddressFromNominatim = async (lat: number, lng: number): Promise<{ regionName?: string; districtName?: string }> => {
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
      
      if (data && data.address) {
        const address = data.address;
        
        // برای ایران، سعی می‌کنیم از فیلدهای مختلف استفاده کنیم
        // اولویت برای region: suburb > quarter > neighbourhood > city_district > town > village
        const regionName = address.suburb || 
                          address.quarter || 
                          address.neighbourhood || 
                          address.city_district ||
                          address.town ||
                          address.village ||
                          address.municipality;
        
        // اولویت برای district: neighbourhood > quarter > suburb > hamlet
        const districtName = address.neighbourhood || 
                           address.quarter || 
                           address.suburb ||
                           address.hamlet;
        
        // اگر هنوز regionName یا districtName نداریم، از display_name استفاده می‌کنیم
        if (!regionName || !districtName) {
          const displayName = data.display_name || '';
          
          // سعی می‌کنیم از display_name استخراج کنیم
          // معمولاً فرمت: "محله، منطقه، شهر، استان، کشور"
          const parts = displayName.split(',').map((p: string) => p.trim());
          
          // اگر regionName نداریم، از قسمت‌های display_name استفاده می‌کنیم
          if (!regionName && parts.length > 2) {
            // معمولاً منطقه در قسمت‌های میانی است
            const potentialRegion = parts.find((p: string) => 
              p.includes('منطقه') || 
              p.includes('Region') || 
              p.includes('ناحیه') ||
              p.length > 3 && p.length < 30
            );
            if (potentialRegion) {
              return {
                regionName: potentialRegion.replace(/منطقه\s*/i, '').trim() || potentialRegion,
                districtName: districtName || parts[0] || 'محله جدید',
              };
            }
          }
          
          // اگر districtName نداریم، از اولین قسمت استفاده می‌کنیم
          if (!districtName && parts.length > 0) {
            return {
              regionName: regionName || parts[1] || 'منطقه جدید',
              districtName: parts[0] || 'محله جدید',
            };
          }
        }
        
        // اگر هر دو را داریم، برمی‌گردانیم
        if (regionName && districtName) {
          return {
            regionName,
            districtName,
          };
        }
        
        // اگر فقط یکی را داریم، دیگری را با یک نام پیش‌فرض می‌سازیم
        if (regionName || districtName) {
          return {
            regionName: regionName || 'منطقه جدید',
            districtName: districtName || 'محله جدید',
          };
        }
      }
    } catch (error) {
      console.error("Error fetching from Nominatim:", error);
    }
    return {};
  };

  const handlePositionChange = async (lat: number, lng: number) => {
    onLocationChange(lat, lng);
    
    if (!onDistrictChange || !cityId) {
      return;
    }

    setIsGeocoding(true);
    try {
      // ابتدا سعی می‌کنیم district موجود را پیدا کنیم
      const result = await realEstateApi.reverseGeocode(lat, lng, cityId);
      
      if (result && result.district && result.district.id) {
        // district موجود پیدا شد
        setCurrentDistrict({
          id: result.district.id,
          name: result.district.name,
          region_name: result.region?.name || '',
        });
        onDistrictChange(result.district.id, result.region?.name || null, result.district.name);
        showSuccess(`محله "${result.district.name}" یافت شد`);
      } else if (result && result.needs_info) {
        // district پیدا نشد، باید region_name و district_name را از Nominatim بگیریم
        // اما district را ایجاد نمی‌کنیم - فقط نام‌ها را ذخیره می‌کنیم تا هنگام ذخیره ملک ایجاد شود
        const nominatimData = await fetchAddressFromNominatim(lat, lng);
        
        if (nominatimData.regionName && nominatimData.districtName) {
          // فقط نام‌ها را ذخیره می‌کنیم - district هنگام ذخیره ملک ایجاد می‌شود
          setCurrentDistrict({
            id: 0, // موقت - هنگام ذخیره ملک ایجاد می‌شود
            name: nominatimData.districtName,
            region_name: nominatimData.regionName,
          });
          onDistrictChange(null, nominatimData.regionName, nominatimData.districtName);
          showSuccess(`منطقه "${nominatimData.regionName}" و محله "${nominatimData.districtName}" پیدا شد. هنگام ذخیره ملک ایجاد می‌شود.`);
        } else {
          // اگر Nominatim نتوانست اطلاعات را برگرداند، از نام‌های پیش‌فرض استفاده می‌کنیم
          // کاربر می‌تواند بعداً این نام‌ها را ویرایش کند
          const defaultRegionName = 'منطقه جدید';
          const defaultDistrictName = 'محله جدید';
          
          setCurrentDistrict({
            id: 0,
            name: defaultDistrictName,
            region_name: defaultRegionName,
          });
          onDistrictChange(null, defaultRegionName, defaultDistrictName);
          showSuccess(`موقعیت روی نقشه ثبت شد. لطفاً نام منطقه و محله را در فیلدهای مربوطه وارد کنید.`);
        }
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      showError(error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleClearLocation = () => {
    onLocationChange(null, null);
    if (onDistrictChange) {
      onDistrictChange(null, null, null);
    }
    setCurrentDistrict(null);
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

      {currentDistrict && !isGeocoding && (
        <div className="text-xs space-y-1 p-2 rounded-md bg-green-0/30 border border-green-1/40">
          <p className="font-medium text-green-2">منطقه: {currentDistrict.region_name}</p>
          <p className="font-medium text-green-2">محله: {currentDistrict.name}</p>
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

