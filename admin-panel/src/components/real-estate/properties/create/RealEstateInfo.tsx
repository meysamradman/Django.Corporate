
import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText, Settings } from "lucide-react";

import { RealEstateTitle } from "./title/RealEstateTitle";
import { RealEstateShortDesc } from "./descriptions/RealEstateShortDesc";
import { RealEstateDescription } from "./descriptions/RealEstateDescription";
import { RealEstateType } from "./types/RealEstateType";
import { RealEstateTransaction } from "./transaction/RealEstateTransaction";
import { RealEstateAssignment } from "./assignment/RealEstateAssignment";
import { RealEstateLabels } from "./labels/RealEstateLabels";
import { RealEstateTags } from "./tags/RealEstateTags";
import { RealEstateFeatures } from "./features/RealEstateFeatures";
import { RealEstateStatus } from "./status/RealEstateStatus";

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
        isFormApproach,
        errors: isFormApproach ? undefined : (props as BaseInfoTabManualProps).errors
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Main Content Area */}
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    <CardWithIcon
                        icon={FileText}
                        title="محتوا و توضیحات"
                        iconBgColor="bg-blue"
                        iconColor="stroke-blue-2"
                        cardBorderColor="border-b-blue-1"
                    >
                        <RealEstateTitle {...commonProps} />
                        <RealEstateShortDesc {...commonProps} />
                        <RealEstateDescription {...commonProps} />
                    </CardWithIcon>

                    <CardWithIcon
                        icon={Settings}
                        title="طبقه‌بندی و ویژگی‌ها"
                        iconBgColor="bg-teal"
                        iconColor="stroke-teal-2"
                        cardBorderColor="border-b-teal-1"
                    >
                        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 lg:gap-8">
                            <RealEstateLabels
                                selectedLabels={selectedLabels}
                                onToggle={onLabelToggle}
                                onRemove={onLabelRemove}
                                editMode={editMode}
                            />
                            <RealEstateTags
                                selectedTags={selectedTags}
                                onToggle={onTagToggle}
                                onRemove={onTagRemove}
                                editMode={editMode}
                            />
                            <RealEstateFeatures
                                selectedFeatures={selectedFeatures}
                                onToggle={onFeatureToggle}
                                onRemove={onFeatureRemove}
                                editMode={editMode}
                            />
                        </div>
                    </CardWithIcon>
                </div>

                {/* Sidebar Area */}
                <div className="w-full lg:w-80 xl:w-96 lg:shrink-0 lg:sticky lg:top-6 self-start z-10">
                    <div className="flex flex-col gap-6">
                        <CardWithIcon
                            icon={Settings}
                            title="نوع و وضعیت معامله"
                            iconBgColor="bg-indigo"
                            iconColor="stroke-indigo-2"
                            cardBorderColor="border-b-indigo-1"
                        >
                            <div className="space-y-6">
                                <RealEstateType {...commonProps} />
                                <RealEstateTransaction {...commonProps} />
                            </div>
                        </CardWithIcon>

                        <CardWithIcon
                            icon={Settings}
                            title="مشاور و آژانس"
                            iconBgColor="bg-purple"
                            iconColor="stroke-purple-2"
                            cardBorderColor="border-b-purple-1"
                        >
                            <RealEstateAssignment {...commonProps} />
                        </CardWithIcon>

                        <CardWithIcon
                            icon={Settings}
                            title="وضعیت نمایش و فعال‌سازی"
                            iconBgColor="bg-blue"
                            iconColor="stroke-blue-2"
                            cardBorderColor="border-b-blue-1"
                            showHeaderBorder={false}
                        >
                            <RealEstateStatus {...commonProps} />
                        </CardWithIcon>
                    </div>
                </div>
            </div>
        </div>
    );
}
