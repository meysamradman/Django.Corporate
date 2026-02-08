import { lazy, Suspense } from "react";
import { FormField } from "@/components/shared/FormField";

const TipTapEditor = lazy(() =>
    import("@/components/shared/TipTapEditor").then(module => ({ default: module.TipTapEditor }))
);

interface PortfolioContentEditorProps {
    descriptionValue: string;
    descriptionError?: string;
    handleDescriptionChange: (content: string) => void;
    placeholder?: string;
}

export function PortfolioContentEditor({
    descriptionValue,
    descriptionError,
    handleDescriptionChange,
    placeholder = "توضیحات کامل نمونه‌کار را وارد کنید... (اختیاری)"
}: PortfolioContentEditorProps) {
    return (
        <FormField
            label="توضیحات بلند"
            error={descriptionError}
        >
            <Suspense fallback={<div className="h-[200px] border rounded-md bg-gray-50 flex items-center justify-center text-gray-400">Loading Editor...</div>}>
                <TipTapEditor
                    content={descriptionValue || ""}
                    onChange={handleDescriptionChange}
                    placeholder={placeholder}
                />
            </Suspense>
        </FormField>
    );
}
