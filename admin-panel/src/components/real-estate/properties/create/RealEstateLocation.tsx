
import type { UseFormReturn } from "react-hook-form";
import { RealEstateLocationSelectors } from "./location/RealEstateLocationSelectors";
import { RealEstateLocationAddress } from "./location/RealEstateLocationAddress";
import { RealEstateLocationMapPicker } from "./location/RealEstateLocationMapPicker";
import { MapPin, Navigation, CheckCircle2 } from "lucide-react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface LocationTabFormProps {
    form: UseFormReturn<PropertyFormValues>;
    editMode: boolean;
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange?: (latitude: number | null, longitude: number | null) => void;
    onRegionNameChange?: (value: string) => void;
    districtName?: string | null;
}

interface LocationTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    latitude?: number | null;
    longitude?: number | null;
    onLocationChange?: (latitude: number | null, longitude: number | null) => void;
    errors?: Record<string, string>;
    districtName?: string | null;
}

type LocationTabProps = LocationTabFormProps | LocationTabManualProps;

export default function RealEstateLocation(props: LocationTabProps) {
    const isFormApproach = 'form' in props;
    const form = isFormApproach ? (props as LocationTabFormProps).form : undefined;
    const formData = isFormApproach ? undefined : (props as LocationTabManualProps).formData;
    const handleInputChange = isFormApproach ? undefined : (props as LocationTabManualProps).handleInputChange;
    const editMode = props.editMode;
    const latitude = props.latitude;
    const longitude = props.longitude;
    const onLocationChange = props.onLocationChange;
    const errors = isFormApproach ? undefined : (props as LocationTabManualProps).errors;
    const province = isFormApproach ? form?.watch("province") : formData?.province;
    const city = isFormApproach ? form?.watch("city") : formData?.city;
    const address = isFormApproach ? form?.watch("address") : formData?.address;
    const hasMapPoint = typeof latitude === "number" && typeof longitude === "number";

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-blue-1/20 bg-blue-0/10 p-4 md:p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full border border-blue-1/25 bg-card text-blue-2 font-semibold">مرحله ۱: انتخاب استان/شهر</span>
                    <span className="px-2.5 py-1 rounded-full border border-blue-1/25 bg-card text-blue-2 font-semibold">مرحله ۲: تعیین نقطه روی نقشه</span>
                    <span className="px-2.5 py-1 rounded-full border border-blue-1/25 bg-card text-blue-2 font-semibold">مرحله ۳: تکمیل نشانی</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-br bg-card px-3 py-2 flex items-center gap-2">
                        <Navigation className="w-3.5 h-3.5 text-blue-2" />
                        <span className="text-font-s">استان/شهر:</span>
                        <span className={province && city ? "text-green-2 font-semibold" : "text-amber-1 font-semibold"}>{province && city ? "تکمیل شده" : "در انتظار انتخاب"}</span>
                    </div>
                    <div className="rounded-lg border border-br bg-card px-3 py-2 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-2" />
                        <span className="text-font-s">مختصات:</span>
                        <span className={hasMapPoint ? "text-green-2 font-semibold" : "text-amber-1 font-semibold"}>{hasMapPoint ? "ثبت شده" : "ثبت نشده"}</span>
                    </div>
                    <div className="rounded-lg border border-br bg-card px-3 py-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-2" />
                        <span className="text-font-s">نشانی:</span>
                        <span className={address ? "text-green-2 font-semibold" : "text-amber-1 font-semibold"}>{address ? "تکمیل شده" : "نیاز به تکمیل"}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 min-w-0 order-2 xl:order-1">
                    <CardWithIcon
                        title="نشانی و محدوده ملک"
                        icon={MapPin}
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                    >
                        <div className="space-y-8">
                            <RealEstateLocationSelectors
                                form={form}
                                formData={formData}
                                handleInputChange={handleInputChange}
                                editMode={editMode}
                                isFormApproach={isFormApproach}
                                errors={errors}
                                districtName={props.districtName}
                            />
                            <RealEstateLocationAddress
                                form={form}
                                formData={formData}
                                handleInputChange={handleInputChange}
                                editMode={editMode}
                                isFormApproach={isFormApproach}
                                errors={errors}
                            />
                        </div>
                    </CardWithIcon>
                </div>
                <div className="xl:col-span-5 min-w-0 order-1 xl:order-2 xl:sticky xl:top-20">
                    <RealEstateLocationMapPicker
                        form={form}
                        formData={formData}
                        handleInputChange={handleInputChange}
                        editMode={editMode}
                        isFormApproach={isFormApproach}
                        latitude={latitude}
                        longitude={longitude}
                        onLocationChange={onLocationChange}
                    />
                </div>
            </div>
        </div>
    );
}

export { RealEstateLocation };
