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
        <div className="w-full h-full">
            <Card className="h-full overflow-hidden border-br shadow-lg bg-card p-0 relative group rounded-3xl flex flex-col">
                <div className="h-80 w-full relative bg-bg/50 border-b border-br z-0 overflow-hidden shrink-0">
                    <LocationMap
                        latitude={property.latitude ? Number(property.latitude) : null}
                        longitude={property.longitude ? Number(property.longitude) : null}
                        onLocationChange={() => { }}
                        disabled={true}
                        className="h-full w-full grayscale-0"
                        minimal={true}
                    />

                    {!hasLocation && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 z-10 backdrop-blur-sm px-6 text-center">
                            <div className="p-3 rounded-full bg-blue-1/10 text-blue-1 mb-3">
                                <MapPin className="w-6 h-6 opacity-40" />
                            </div>
                            <span className="text-xs font-black text-font-s">
                                موقعیت مکانی برای این ملک ثبت نشده است
                            </span>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-static-b/30 to-transparent pointer-events-none" />
                </div>

                <div className="p-6 relative z-10 bg-card flex flex-col items-center flex-1 -mt-10 mx-4 mb-4 rounded-3xl shadow-xl ring-1 ring-br/20">
                    <div className="mb-4 -mt-14">
                        <div className="bg-blue-1 text-wt p-4 rounded-2xl shadow-xl shadow-blue-1/30 ring-8 ring-card transition-transform duration-300 group-hover:scale-110 flex items-center justify-center">
                            <MapPin className="w-8 h-8 fill-current" />
                        </div>
                    </div>

                    <div className="text-center space-y-4 mb-6 flex-1 w-full">
                        <h3 className="font-black text-font-p text-xl tracking-tight">موقعیت مکانی ملک</h3>
                        <p className="text-sm font-bold text-font-s leading-relaxed px-2 opacity-70">
                            {property.address || "آدرس دقیق در سیستم ثبت نشده است"}
                        </p>
                    </div>

                    {hasLocation && (
                        <Button
                            className="w-full h-12 text-xs font-black bg-blue-1 hover:bg-blue-1/90 text-wt shadow-xl shadow-blue-1/20 transition-all rounded-xl gap-2"
                            onClick={() => window.open(googleMapsUrl, '_blank')}
                        >
                            <Navigation className="w-4 h-4 fill-current" />
                            مسیریابی با گوگل مپ
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
