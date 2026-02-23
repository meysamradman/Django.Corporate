import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/elements/Button';
import { Plus, X } from 'lucide-react';
import type { MediaFile } from '../hooks/useMediaUpload';

interface FileItemCoverPickerProps {
    file: MediaFile;
    fileCategory: string;
    disabled: boolean;
    onCoverFileChange: (event: ChangeEvent<HTMLInputElement>, fileId: string) => void;
    onRemoveCoverFile: (id: string) => void;
}

export function FileItemCoverPicker({
    file,
    fileCategory,
    disabled,
    onCoverFileChange,
    onRemoveCoverFile,
}: FileItemCoverPickerProps) {
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    const handleCoverFileSelectClick = () => {
        if (coverFileInputRef.current) {
            coverFileInputRef.current.click();
        }
    };

    return (
        <div className="space-y-3">
            <input
                ref={coverFileInputRef}
                type="file"
                id={`cover-file-${file.id}`}
                className="hidden"
                accept="image/*"
                onChange={(e) => onCoverFileChange(e, file.id)}
                disabled={disabled}
            />

            {file.coverFile ? (
                <div className="relative w-full h-48 bg-bg/30 rounded-lg overflow-hidden border shadow-sm group">
                    <img
                        src={URL.createObjectURL(file.coverFile)}
                        alt="کاور"
                        className="w-full h-full object-cover"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={() => onRemoveCoverFile(file.id)}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div
                    onClick={handleCoverFileSelectClick}
                    className="border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-linear-to-br hover:from-primary/5 hover:to-transparent transition-all duration-200 group"
                >
                    <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-200">
                        <Plus className="h-8 w-8 text-font-s group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-font-p">
                        تصویر کاور ({fileCategory === 'video' ? 'ویدیو' : fileCategory === 'audio' ? 'فایل صوتی' : 'سند PDF'})
                    </p>
                </div>
            )}
        </div>
    );
}