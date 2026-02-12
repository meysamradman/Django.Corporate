import { Input } from '@/components/elements/Input';
import { Label } from '@/components/elements/Label';

interface FileItemMetadataFieldsProps {
    fileId: string;
    title: string;
    altText: string;
    disabled: boolean;
    onTitleChange: (value: string) => void;
    onAltTextChange: (value: string) => void;
}

export function FileItemMetadataFields({
    fileId,
    title,
    altText,
    disabled,
    onTitleChange,
    onAltTextChange,
}: FileItemMetadataFieldsProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor={`title-${fileId}`} className="text-sm font-medium text-font-p">
                    عنوان
                </Label>
                <Input
                    id={`title-${fileId}`}
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="عنوان فایل"
                    className="h-9 text-sm"
                    disabled={disabled}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor={`altText-${fileId}`} className="text-sm font-medium text-font-p">
                    متن جایگزین (برای تصاویر)
                </Label>
                <Input
                    id={`altText-${fileId}`}
                    value={altText}
                    onChange={(e) => onAltTextChange(e.target.value)}
                    placeholder="توضیح کوتاه برای دسترسی‌پذیری"
                    className="h-9 text-sm"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}