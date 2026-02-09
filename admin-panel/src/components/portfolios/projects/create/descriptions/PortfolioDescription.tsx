
import type { UseFormReturn } from "react-hook-form";
import type { PortfolioFormValues } from "@/components/portfolios/validations/portfolioSchema";
import { PortfolioContentEditor } from "../info/PortfolioContentEditor";

interface PortfolioDescriptionProps {
    form?: UseFormReturn<PortfolioFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function PortfolioDescription({ form, formData, handleInputChange, editMode, isFormApproach }: PortfolioDescriptionProps) {
    const { formState: { errors }, watch, setValue } = isFormApproach && form
        ? form
        : { formState: { errors: {} as any }, watch: null, setValue: null };

    const descriptionValue = isFormApproach ? watch?.("description") : formData?.description;

    const handleDescriptionChange = (content: string) => {
        if (isFormApproach && setValue) {
            setValue("description" as any, content, { shouldValidate: true });
        } else {
            handleInputChange?.("description", content);
        }
    };

    return (
        <PortfolioContentEditor
            descriptionValue={descriptionValue || ""}
            descriptionError={errors.description?.message}
            handleDescriptionChange={handleDescriptionChange}
        />
    );
}
