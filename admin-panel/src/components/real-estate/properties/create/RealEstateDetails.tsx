import { useEffect, useState, useCallback } from "react";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Home, DollarSign, Layers } from "lucide-react";
import { realEstateApi } from "@/api/real-estate";
import { DetailsDimensions } from "./details/DetailsDimensions";
import { DetailsFacilities } from "./details/DetailsFacilities";
import { DetailsFinancial } from "./details/DetailsFinancial";

interface DetailsTabProps {
    formData: any;
    handleInputChange: (field: string, value: any) => void;
    editMode: boolean;
    errors?: Record<string, string>;
}

export default function RealEstateDetails({ formData, handleInputChange, editMode, errors }: DetailsTabProps) {
    const [fieldOptions, setFieldOptions] = useState<any>(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    useEffect(() => {
        const loadFieldOptions = async () => {
            try {
                setIsLoadingOptions(true);
                const options = await realEstateApi.getFieldOptions();
                setFieldOptions(options);
            } catch (error) {
                console.error("Load field options error:", error);
            } finally {
                setIsLoadingOptions(false);
            }
        };
        loadFieldOptions();
    }, []);

    const handleNumericChange = useCallback((field: string) => (e: any) => {
        const val = e.target.value;
        if (val === "") {
            handleInputChange(field, null);
            return;
        }
        const num = Number(val);
        if (!isNaN(num)) {
            handleInputChange(field, num);
        }
    }, [handleInputChange]);

    const handleSelectChange = useCallback((field: string) => (value: string) => {
        const num = value === "" ? null : Number(value);
        handleInputChange(field, num);
    }, [handleInputChange]);

    return (
        <div className="space-y-8 pb-10">
            <CardWithIcon
                icon={Layers}
                title="مشخصات فیزیکی و ابعاد"
                iconBgColor="bg-blue"
                iconColor="stroke-blue-2"
                cardBorderColor="border-b-blue-1"
            >
                <DetailsDimensions
                    formData={formData}
                    editMode={editMode}
                    errors={errors}
                    fieldOptions={fieldOptions}
                    isLoadingOptions={isLoadingOptions}
                    handleNumericChange={handleNumericChange}
                    handleSelectChange={handleSelectChange}
                    handleInputChange={handleInputChange}
                />
            </CardWithIcon>

            <CardWithIcon
                icon={Home}
                title="امکانات و فضاها"
                iconBgColor="bg-purple"
                iconColor="stroke-purple-2"
                cardBorderColor="border-b-purple-1"
            >
                <DetailsFacilities
                    formData={formData}
                    editMode={editMode}
                    errors={errors}
                    fieldOptions={fieldOptions}
                    isLoadingOptions={isLoadingOptions}
                    handleSelectChange={handleSelectChange}
                />
            </CardWithIcon>

            <CardWithIcon
                icon={DollarSign}
                title="قیمت و شرایط مالی"
                iconBgColor="bg-green"
                iconColor="stroke-green-2"
                cardBorderColor="border-b-green-1"
            >
                <DetailsFinancial
                    formData={formData}
                    editMode={editMode}
                    errors={errors}
                    handleNumericChange={handleNumericChange}
                />
            </CardWithIcon>
        </div>
    );
}
