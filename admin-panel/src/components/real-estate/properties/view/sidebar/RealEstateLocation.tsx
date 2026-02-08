import type { Property } from "@/types/real_estate/realEstate";
import LocationMap from "@/components/real-estate/layouts/LocationMap";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/elements/Button";
import { ValueFallback } from "@/components/shared/ValueFallback";

interface RealEstateLocationProps {
    property: Property;
}

export function RealEstateLocation({ property }: RealEstateLocationProps) {
    const hasLocation = property.latitude && property.longitude;
    const googleMapsUrl = hasLocation
        ? `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`
        : "#";

    return (
        <>
            <div className="h-[380px] w-full relative bg-bg/50 z-0 overflow-hidden shrink-0 border-b border-br/40">
                <LocationMap
                    latitude={property.latitude ? Number(property.latitude) : null}
                    longitude={property.longitude ? Number(property.longitude) : null}
                    onLocationChange={() => { }}
                    disabled={true}
                    className="h-full w-full grayscale-0"
                    minimal={true}
                />

                <div className="absolute inset-0 bg-linear-to-t from-static-b/20 via-transparent to-transparent pointer-events-none z-10" />

                {!hasLocation && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 z-20 backdrop-blur-md px-8 text-center">
                        <div className="p-4 rounded-3xl bg-blue-1/10 text-blue-1 mb-4 shadow-inner ring-1 ring-blue-1/20">
                            <MapPin className="w-8 h-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-black text-font-p mb-1">عدم ثبت موقعیت</h4>
                        <span className="text-[10px] font-bold text-font-s opacity-60 leading-relaxed">
                            متأسفانه موقعیت مکانی دقیقی برای این ملک در سیستم ثبت نشده است.
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-bg/40 via-wt/20 to-card/40 opacity-50" />
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-1/10 to-transparent" />

                <div className="relative z-10 p-8 flex flex-col items-center justify-center h-full text-center">
                    <div className="mb-6">
                        <div className="bg-blue-1 text-wt p-4 rounded-2xl shadow-xl shadow-blue-1/20 ring-4 ring-card flex items-center justify-center">
                            <MapPin className="w-6 h-6 fill-current" />
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 w-full max-w-[240px]">
                        <h3 className="font-black text-font-p text-lg tracking-tight">موقعیت مکانی ملک</h3>
                        <p className="text-[11px] font-bold text-font-s leading-relaxed opacity-70">
                            <ValueFallback
                                value={property.address}
                                fallback="آدرس دقیق ثبت نشده است"
                                className="bg-transparent border-none p-0 text-font-s opacity-70"
                            />
                        </p>
                    </div>

                    {hasLocation && (
                        <Button
                            className="w-full h-12 text-[11px] font-black bg-blue-1 hover:bg-blue-2 text-wt shadow-xl shadow-blue-1/20 transition-all rounded-2xl gap-2 group/btn relative overflow-hidden"
                            onClick={() => window.open(googleMapsUrl, '_blank')}
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-wt/0 via-wt/10 to-wt/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            <Navigation className="w-4 h-4 fill-current transition-transform group-hover/btn:translate-x-1" />
                            مسیریابی با گوگل مپ
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
