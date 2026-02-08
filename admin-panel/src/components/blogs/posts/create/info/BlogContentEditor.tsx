import { lazy, Suspense } from "react";
import { FormField } from "@/components/shared/FormField";

const TipTapEditor = lazy(() =>
    import("@/components/shared/TipTapEditor").then(module => ({ default: module.TipTapEditor }))
);

interface BlogContentEditorProps {
    descriptionValue: string;
    descriptionError?: string;
    handleDescriptionChange: (content: string) => void;
    placeholder?: string;
}

export function BlogContentEditor({
    descriptionValue,
    descriptionError,
    handleDescriptionChange,
    placeholder = "توضیحات کامل وبلاگ را وارد کنید... (اختیاری)"
}: BlogContentEditorProps) {
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
