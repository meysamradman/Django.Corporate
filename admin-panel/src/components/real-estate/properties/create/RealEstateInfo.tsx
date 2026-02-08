
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText, Settings } from "lucide-react";

import { PropertyTitle } from "./info/PropertyTitle";
import { PropertyShortDesc } from "./info/PropertyShortDesc";
import { PropertyDescription } from "./info/PropertyDescription";
import { PropertyType } from "./info/PropertyType";
import { PropertyTransaction } from "./info/PropertyTransaction";
import { PropertyAssignment } from "./info/PropertyAssignment";
import { PropertyLabels } from "./info/PropertyLabels";
import { PropertyTags } from "./info/PropertyTags";
import { PropertyFeatures } from "./info/PropertyFeatures";
import { PropertyStatus } from "./info/PropertyStatus";

import type { PropertyLabel } from "@/types/real_estate/label/realEstateLabel";
import type { PropertyFeature } from "@/types/real_estate/feature/realEstateFeature";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyFormValues } from "@/components/real-estate/validations/propertySchema";

interface BaseInfoTabFormProps {
    form: UseFormReturn<PropertyFormValues>;
    editMode: boolean;
    selectedLabels: PropertyLabel[];
    selectedTags: PropertyTag[];
    selectedFeatures: PropertyFeature[];
    onLabelToggle: (label: PropertyLabel) => void;
    onLabelRemove: (labelId: number) => void;
    onTagToggle: (tag: PropertyTag) => void;
    onTagRemove: (tagId: number) => void;
    onFeatureToggle: (feature: PropertyFeature) => void;
    onFeatureRemove: (featureId: number) => void;
    propertyId?: number | string;
}

interface BaseInfoTabManualProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    selectedLabels: PropertyLabel[];
    selectedTags: PropertyTag[];
    selectedFeatures: PropertyFeature[];
    onLabelToggle: (label: PropertyLabel) => void;
    onLabelRemove: (labelId: number) => void;
    onTagToggle: (tag: PropertyTag) => void;
    onTagRemove: (tagId: number) => void;
    onFeatureToggle: (feature: PropertyFeature) => void;
    onFeatureRemove: (featureId: number) => void;
    propertyId?: number | string;
    errors?: Record<string, string>;
}

type BaseInfoTabProps = BaseInfoTabFormProps | BaseInfoTabManualProps;

export default function RealEstateInfo(props: BaseInfoTabProps) {
    const isFormApproach = 'form' in props;
    const form = isFormApproach ? (props as BaseInfoTabFormProps).form : undefined;
    const formData = isFormApproach ? null : (props as any).formData;
    const handleInputChange = isFormApproach ? null : (props as any).handleInputChange;
    const editMode = props.editMode;

    const {
        selectedLabels, selectedTags, selectedFeatures,
        onLabelToggle, onLabelRemove,
        onTagToggle, onTagRemove,
        onFeatureToggle, onFeatureRemove
    } = props;

    const commonProps = {
        form,
        formData,
        handleInputChange,
        editMode,
        isFormApproach
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    <CardWithIcon
                        icon={FileText}
                        title="محتوا و توضیحات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                    >
                        <PropertyTitle {...commonProps} />
                        <PropertyShortDesc {...commonProps} />
                        <PropertyDescription {...commonProps} />
                    </CardWithIcon>

                    <CardWithIcon
                        icon={Settings}
                        title="طبقه‌بندی و وضعیت"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                    >
                        <PropertyType {...commonProps} />
                        <PropertyTransaction {...commonProps} />
                        <PropertyAssignment {...commonProps} />
                    </CardWithIcon>
                </div>

                <div className="w-full lg:w-[420px] lg:shrink-0">
                    <CardWithIcon
                        icon={Settings}
                        title="تنظیمات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                        className="lg:sticky lg:top-20"
                    >
                        <div className="space-y-8">
                            <PropertyLabels
                                selectedLabels={selectedLabels}
                                onToggle={onLabelToggle}
                                onRemove={onLabelRemove}
                                editMode={editMode}
                            />
                            <PropertyTags
                                selectedTags={selectedTags}
                                onToggle={onTagToggle}
                                onRemove={onTagRemove}
                                editMode={editMode}
                            />
                            <PropertyFeatures
                                selectedFeatures={selectedFeatures}
                                onToggle={onFeatureToggle}
                                onRemove={onFeatureRemove}
                                editMode={editMode}
                            />
                            <PropertyStatus {...commonProps} />
                        </div>
                    </CardWithIcon>
                </div>
            </div>
        </div>
    );
}
