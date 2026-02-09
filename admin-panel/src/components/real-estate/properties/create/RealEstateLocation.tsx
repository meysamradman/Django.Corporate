
import type { UseFormReturn } from "react-hook-form";
import { RealEstateLocationSelectors } from "./location/RealEstateLocationSelectors";
import { RealEstateLocationAddress } from "./location/RealEstateLocationAddress";
import { RealEstateLocationMapPicker } from "./location/RealEstateLocationMapPicker";
import { MapPin } from "lucide-react";
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
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
                <div className="flex-1 min-w-0">
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
