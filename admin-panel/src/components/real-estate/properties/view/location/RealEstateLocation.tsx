import type { ReactNode } from "react";
import type { Property } from "@/types/real_estate/realEstate";
import LocationMap from "@/components/real-estate/layouts/LocationMap";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ValueFallback } from "@/components/shared/ValueFallback";

interface RealEstateLocationProps {
    property: Property;
    bottomSlot?: ReactNode;
}

export function RealEstateLocation({ property, bottomSlot }: RealEstateLocationProps) {
    const hasLocation = property.latitude && property.longitude;
    const googleMapsUrl = hasLocation
        ? `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`
        : "#";

    return (
        <div className="h-full flex flex-col">
            <div className="relative flex-[0_0_66%] min-h-72 w-full bg-bg/50 z-0 overflow-hidden border-b border-br/40">
                <LocationMap
                    latitude={property.latitude ? Number(property.latitude) : null}
                    longitude={property.longitude ? Number(property.longitude) : null}
                    onLocationChange={() => { }}
                    disabled={false}
                    editable={false}
                    className="h-full w-full grayscale-0"
                    minimal={true}
                />

                <div className="absolute inset-0 bg-linear-to-t from-static-b/25 via-transparent to-transparent pointer-events-none z-10" />

                {hasLocation && (
                    <div className="absolute left-3 right-3 bottom-3 z-20">
                        <Button
                            className="w-full h-10 text-[11px] font-black bg-blue-1 hover:bg-blue-2 text-wt shadow-lg shadow-blue-1/20 rounded-xl gap-2"
                            onClick={() => window.open(googleMapsUrl, "_blank")}
                        >
                            <Navigation className="w-4 h-4 fill-current" />
                            مسیریابی
                        </Button>
                    </div>
                )}

                {!hasLocation && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 z-20 backdrop-blur-md px-8 text-center">
                        <div className="p-4 rounded-3xl bg-blue-1/10 text-blue-1 mb-3 shadow-inner ring-1 ring-blue-1/20">
                            <MapPin className="w-8 h-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-black text-font-p mb-1">عدم ثبت موقعیت</h4>
                        <span className="text-[10px] font-bold text-font-s opacity-70 leading-relaxed">
                            موقعیت مکانی دقیق برای این ملک ثبت نشده است.
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 p-3.5 space-y-3 bg-linear-to-b from-bg/35 to-transparent">
                <div className="rounded-2xl border border-br/60 bg-wt/75 p-3">
                    <p className="text-[11px] font-bold text-font-s leading-relaxed">
                        <ValueFallback
                            value={property.address}
                            fallback="آدرس دقیق ثبت نشده است"
                            className="bg-transparent border-none p-0 text-font-s"
                        />
                    </p>
                    {property.postal_code && (
                        <p className="text-[11px] font-bold text-font-s opacity-80 mt-2">
                            کد پستی: <span className="text-font-p">{property.postal_code}</span>
                        </p>
                    )}
                </div>

                {bottomSlot && (
                    <div className="w-full">
                        {bottomSlot}
                    </div>
                )}
            </div>
        </div>
    );
}
