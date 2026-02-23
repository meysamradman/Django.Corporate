import type { UseFormReturn } from "react-hook-form";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { FileText } from "lucide-react";
import type { BlogFormValues } from "@/components/blogs/validations/blogSchema";
import { BlogContentMain } from "./BlogContentMain";
import { BlogContentEditor } from "./BlogContentEditor";

interface BlogContentProps {
    form?: UseFormReturn<BlogFormValues>;
    formData?: any;
    handleInputChange?: (field: string, value: any) => void;
    editMode: boolean;
    isFormApproach: boolean;
}

export function BlogContent({ form, formData, handleInputChange, editMode, isFormApproach }: BlogContentProps) {
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
                <BlogContentMain
                    form={form}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    editMode={editMode}
                    isFormApproach={isFormApproach}
                />

                <BlogContentEditor
                    descriptionValue={descriptionValue || ""}
                    descriptionError={errors.description?.message}
                    handleDescriptionChange={handleDescriptionChange}
                />
            </div>
        </CardWithIcon>
    );
}
