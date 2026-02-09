
import type { UseFormReturn } from "react-hook-form";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import { BlogContentEditor } from "../info/BlogContentEditor";

interface BlogDescriptionProps {
    form?: UseFormReturn<BlogFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function BlogDescription({ form, formData, handleInputChange, editMode, isFormApproach }: BlogDescriptionProps) {
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
        <BlogContentEditor
            descriptionValue={descriptionValue || ""}
            descriptionError={errors.description?.message}
            handleDescriptionChange={handleDescriptionChange}
        />
    );
}
