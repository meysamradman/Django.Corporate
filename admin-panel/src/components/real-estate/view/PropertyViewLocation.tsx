import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Button } from "@/components/elements/Button";
import { MapPin } from "lucide-react";

import type { Property } from "@/types/real_estate/realEstate";

interface PropertyViewLocationProps {
    property: Property;
}

export function PropertyViewLocation({ property }: PropertyViewLocationProps) {
    const hasLocation = property.latitude && property.longitude;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="w-full">
                    <CardWithIcon
                        title="اطلاعات مکانی و آدرس"
                        icon={MapPin}
                        iconBgColor="bg-emerald"
                        iconColor="stroke-emerald-2"
                        borderColor="border-b-emerald-1"
                    >
                        <div className="space-y-4">
                            {property.province_name && (
                                <div className="flex justify-between items-start border-b pb-3 border-dashed">
                                    <span className="text-font-s font-medium text-gray-2">استان</span>
                                    <span className="text-font-p font-medium">{property.province_name}</span>
                                </div>
                            )}

                            {property.city_name && (
                                <div className="flex justify-between items-start border-b pb-3 border-dashed">
                                    <span className="text-font-s font-medium text-gray-2">شهر</span>
                                    <span className="text-font-p font-medium">{property.city_name}</span>
                                </div>
                            )}

                            {property.district_name && (
                                <div className="flex justify-between items-start border-b pb-3 border-dashed">
                                    <span className="text-font-s font-medium text-gray-2">منطقه</span>
                                    <span className="text-font-p font-medium">{property.district_name}</span>
                                </div>
                            )}

                            {property.neighborhood && (
                                <div className="flex justify-between items-start border-b pb-3 border-dashed">
                                    <span className="text-font-s font-medium text-gray-2">محله</span>
                                    <span className="text-font-p font-medium">{property.neighborhood}</span>
                                </div>
                            )}

                            {property.postal_code && (
                                <div className="flex justify-between items-start border-b pb-3 border-dashed">
                                    <span className="text-font-s font-medium text-gray-2">کد پستی</span>
                                    <span className="text-font-p font-medium tracking-wider">{property.postal_code}</span>
                                </div>
                            )}

                            {property.address && (
                                <div className="pt-2">
                                    <span className="text-font-s font-medium text-gray-2 block mb-2">آدرس دقیق</span>
                                    <p className="text-font-p leading-relaxed bg-bg-2/50 p-3 rounded-lg border border-br/50">
                                        {property.address}
                                    </p>
                                </div>
                            )}

                            {hasLocation && (
                                <div className="pt-4 flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const url = `https://www.google.com/maps?q=${property.latitude},${property.longitude}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="flex items-center gap-2 text-xs"
                                    >
                                        <MapPin className="w-3 h-3" />
                                        مسیریابی در Google Maps
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardWithIcon>
                </div>

            </div>
        </div>

    );
}
