import {
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/elements/Dialog';
import { Button } from '@/components/elements/Button';
import { FolderOpen, Upload, X } from 'lucide-react';

interface MediaLibraryHeaderTabsProps {
    showTabs: boolean;
    currentActiveTab: 'select' | 'upload';
    canUploadMedia: boolean;
    onTabChange: (tab: 'select' | 'upload') => void;
}

export function MediaLibraryHeaderTabs({
    showTabs,
    currentActiveTab,
    canUploadMedia,
    onTabChange,
}: MediaLibraryHeaderTabsProps) {
    return (
        <>
            <DialogHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <DialogTitle>انتخاب از کتابخانه رسانه</DialogTitle>
                    </div>
                    <div className="flex items-center">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 cursor-pointer hover:bg-font-s/10"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </div>
                <DialogDescription className="sr-only">
                    کتابخانه رسانه برای انتخاب فایل‌های موجود یا آپلود فایل جدید استفاده می‌شود.
                </DialogDescription>
            </DialogHeader>

            {showTabs && (
                <div className="border-b">
                    <div className="flex space-x-1 px-4 py-2">
                        <Button
                            variant={currentActiveTab === 'select' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onTabChange('select')}
                            className="flex gap-2"
                        >
                            <FolderOpen className="h-4 w-4" />
                            انتخاب از کتابخانه
                        </Button>
                        {canUploadMedia && (
                            <Button
                                variant={currentActiveTab === 'upload' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onTabChange('upload')}
                                className="flex gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                آپلود فایل جدید
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}