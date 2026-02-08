import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText } from "lucide-react";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { PortfolioContentMain } from "./PortfolioContentMain";
import { PortfolioContentEditor } from "./PortfolioContentEditor";

interface PortfolioContentProps {
    form?: UseFormReturn<PortfolioFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PortfolioContent({ form, formData, handleInputChange, editMode, isFormApproach }: PortfolioContentProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;

    const handleDescriptionChange = (content: string) => {
        if (isFormApproach && setValue) {
            setValue("description", content);
        } else {
            handleInputChange?.("description", content);
        }
    };

    return (
        <CardWithIcon
            icon={FileText}
            title="اطلاعات پایه"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
        >
            <div className="space-y-6">
                <PortfolioContentMain
                    form={form}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    editMode={editMode}
                    isFormApproach={isFormApproach}
                />

                <PortfolioContentEditor
                    descriptionValue={descriptionValue || ""}
                    descriptionError={errors.description?.message}
                    handleDescriptionChange={handleDescriptionChange}
                />
            </div>
        </CardWithIcon>
    );
}
