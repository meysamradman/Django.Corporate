import { Button } from '@/components/elements/Button';
import { Loader2, Upload } from 'lucide-react';

interface MediaUploadActionBarProps {
    isUploading: boolean;
    fileCount: number;
    onCancel: () => void;
    onUpload: () => void;
}

export function MediaUploadActionBar({
    isUploading,
    fileCount,
    onCancel,
    onUpload,
}: MediaUploadActionBarProps) {
    return (
        <div className="bg-linear-to-r from-bg/80 to-bg/50 border-t px-6 py-4">
            <div className="flex gap-3 justify-between">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isUploading}
                        className="hover:bg-font-s/10"
                    >
                        انصراف
                    </Button>
                </div>
                <Button
                    onClick={onUpload}
                    disabled={isUploading || fileCount === 0}
                    className="bg-primary hover:bg-primary/90 text-static-w gap-2 font-medium"
                >
                    {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!isUploading && <Upload className="h-4 w-4" />}
                    {isUploading ? 'در حال آپلود...' : `آپلود ${fileCount} فایل`}
                </Button>
            </div>
        </div>
    );
}