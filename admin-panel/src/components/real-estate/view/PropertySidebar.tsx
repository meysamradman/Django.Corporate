import { Card } from "@/components/elements/Card";
import type { Property } from "@/types/real_estate/realEstate";
import LocationMap from "@/components/real-estate/layouts/LocationMap";
import {
    MapPin,
    Navigation
} from "lucide-react";
import { Button } from "@/components/elements/Button";

interface PropertySidebarProps {
    property: Property;
}

export function PropertySidebar({ property }: PropertySidebarProps) {
    const hasLocation = property.latitude && property.longitude;
    const googleMapsUrl = hasLocation
        ? `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`
        : "#";

    return (
        <div className="w-full space-y-6 sticky top-24 self-start">

            <Card className="overflow-hidden border-br shadow-sm bg-card p-0 relative group">

                <div className="h-72 w-full relative bg-bg-2 border-b border-br z-0">
                    <LocationMap
                        latitude={property.latitude ? Number(property.latitude) : null}
                        longitude={property.longitude ? Number(property.longitude) : null}
                        onLocationChange={() => { }}
                        disabled={true}
                        className="h-full w-full grayscale-[10%] group-hover:grayscale-0 transition-all duration-500"
                        minimal={true}
                    />

                    <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-black/60 to-transparent pointer-events-none opacity-60" />

                    {!hasLocation && (
                        <div className="absolute inset-0 flex items-center justify-center bg-bg-2/80 z-10 backdrop-blur-xs">
                            <span className="text-sm text-font-s font-medium flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                موقعیت ثبت نشده است
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-5 pt-4 relative z-10 bg-card -mt-2 rounded-t-2xl shadow-item-top">
                    <div className="flex justify-center -mt-8 mb-3">
                        <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg ring-4 ring-card">
                            <MapPin className="w-6 h-6 fill-current" />
                        </div>
                    </div>

                    <div className="text-center space-y-2 mb-5">
                        <h3 className="font-bold text-font-p text-lg">موقعیت مکانی ملک</h3>
                        <p className="text-sm text-font-s leading-relaxed px-2">
                            {property.address || "آدرس دقیق ثبت نشده است"}
                        </p>
                        {(property.province_name || property.city_name) && (
                            <div className="flex items-center justify-center gap-2 text-xs text-font-s opacity-80 pt-1">
                                <span>{property.province_name}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>{property.city_name}</span>
                                {property.neighborhood && (
                                    <>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span>{property.neighborhood}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {hasLocation && (
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                className="w-full h-12 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-blue/20 shadow-lg transition-all"
                                onClick={() => window.open(googleMapsUrl, '_blank')}
                            >
                                <Navigation className="w-5 h-5 me-2 fill-current" />
                                مسیریابی با گوگل
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
