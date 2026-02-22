import type { ChangeEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/elements/Button';
import { Progress } from '@/components/elements/Progress';
import { FileDropzone } from '@/components/media/upload/MediaUploadZone';
import { FileList } from '@/components/media/upload/FileList';
import type { MediaFile, UploadSettings } from '@/components/media/hooks/useMediaUpload';
import { showError, showWarning } from '@/core/toast';
import { getAction } from '@/core/messages/ui';

interface MediaLibraryUploadTabProps {
    isLoadingSettings: boolean;
    canUploadMedia: boolean;
    isUploading: boolean;
    uploadSettings: UploadSettings;
    validationErrors: string[];
    files: MediaFile[];
    uploadProgress: number;
    processFiles: (files: File[]) => void;
    removeFile: (id: string) => void;
    updateFileMetadata: (id: string, field: keyof MediaFile, value: string | boolean | File | null) => void;
    removeCoverFile: (id: string) => void;
    onCoverFileChange: (event: ChangeEvent<HTMLInputElement>, mediaFileId: string) => void;
    onTabChange: (tab: 'select' | 'upload') => void;
    onUpload: () => Promise<void>;
}

export function MediaLibraryUploadTab({
    isLoadingSettings,
    canUploadMedia,
    isUploading,
    uploadSettings,
    validationErrors,
    files,
    uploadProgress,
    processFiles,
    removeFile,
    updateFileMetadata,
    removeCoverFile,
    onCoverFileChange,
    onTabChange,
    onUpload,
}: MediaLibraryUploadTabProps) {
    return (
        <div className="grow flex flex-col min-h-0 overflow-hidden">
            <div className="grow overflow-y-auto px-6 py-4 custom-scrollbar bg-bg/30">
                <div className="space-y-3">
                    {isLoadingSettings ? (
                        <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                            <p className="text-sm text-font-s">در حال بارگذاری تنظیمات...</p>
                        </div>
                    ) : (
                        <>
                            <FileDropzone
                                onFilesAdded={(incomingFiles) => {
                                    if (!canUploadMedia) {
                                        showError(getAction('uploadPermissionDenied'));
                                        return;
                                    }
                                    if (isLoadingSettings) {
                                        showWarning(getAction('waitForSettingsLoad'));
                                        return;
                                    }
                                    processFiles(incomingFiles);
                                }}
                                allowedTypes={uploadSettings?.allowedTypes || { image: [], video: [], audio: [], document: [] }}
                                disabled={isUploading || !canUploadMedia || isLoadingSettings}
                            />

                            {validationErrors && validationErrors.length > 0 && (
                                <div className="bg-red-0 border border-red-1/30 p-4 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-1 shrink-0 mt-0.5" />
                                        <div className="grow space-y-4">
                                            <p className="text-sm font-medium text-red-1">خطا در آپلود فایل:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-red-1/80">
                                                {validationErrors.map((itemError: string, index: number) => (
                                                    <li key={index}>{itemError}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {isUploading && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-font-s">
                            <span>در حال آپلود...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                    </div>
                )}

                {files.length > 0 && (
                    <div>
                        <FileList
                            files={files}
                            activeTab="upload"
                            onTabChange={() => { }}
                            onRemoveFile={removeFile}
                            onUpdateMetadata={updateFileMetadata}
                            onCoverFileChange={onCoverFileChange}
                            onRemoveCoverFile={removeCoverFile}
                            disabled={isUploading}
                        />
                    </div>
                )}
            </div>

            {files.length > 0 && canUploadMedia && (
                <div className="bg-bg/50 border-t px-6 py-4">
                    <div className="flex gap-3 justify-between">
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => onTabChange('select')} disabled={isUploading}>
                                انصراف
                            </Button>
                        </div>
                        <Button
                            onClick={onUpload}
                            disabled={isUploading || files.length === 0}
                            className="flex gap-2"
                        >
                            {isUploading && <Loader2 className="animate-spin" />}
                            {isUploading ? 'در حال آپلود...' : `آپلود ${files.length} فایل`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}