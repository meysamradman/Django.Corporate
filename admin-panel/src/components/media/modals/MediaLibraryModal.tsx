import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Progress } from "@/components/elements/Progress";
import { mediaApi, DEFAULT_MEDIA_PAGE_SIZE } from '@/api/media/media';
import type { Media, MediaFilter } from '@/types/shared/media';
import { MediaPreview } from '@/components/media/base/MediaPreview';
import { Input } from '@/components/elements/Input';
import { PaginationControls } from '@/components/shared/Pagination';
import { ImageOff, CheckSquare, Square, FolderOpen, Upload, Loader2, X, Play, FileAudio, FileText, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/elements/Skeleton';
import { cn } from '@/core/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select";
import { FileDropzone } from '@/components/media/upload/MediaUploadZone';
import { FileList } from '@/components/media/upload/FileList';
import { useMediaUpload } from '@/components/media/hooks/useMediaUpload';
import { showError, showWarning } from "@/core/toast";
import { useUserPermissions } from '@/core/permissions/hooks/useUserPermissions';
import { useHasAccess } from '@/core/permissions/hooks/useHasAccess';
import { mediaService } from '@/components/media/services';
import { MediaDetailsModal } from '@/components/media/modals/MediaDetailsModal';
import { useDebounceValue } from '@/core/hooks/useDebounce';
import { useMediaContext } from '../MediaContext';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedMedia: Media[] | Media) => void;
  selectMultiple?: boolean;
  initialFileType?: string;
  showTabs?: boolean;
  activeTab?: "select" | "upload";
  onTabChange?: (tab: "select" | "upload") => void;
  onUploadComplete?: () => void;
  context?: 'media_library' | 'portfolio' | 'blog' | 'real_estate';
  contextId?: number | string;
}

const actualDefaultFilters = {
  search: "",
  file_type: "all" as string | undefined,
  page: 1,
  limit: 12,
  ordering: "-created_at",
};

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  selectMultiple = false,
  initialFileType = "all",
  showTabs = true,
  activeTab = "select",
  onTabChange,
  onUploadComplete,
  context: overrideContext,
  contextId: overrideContextId,
}: MediaLibraryModalProps) {
  const { context, contextId } = useMediaContext(overrideContext, overrideContextId);

  const [internalActiveTab, setInternalActiveTab] = useState<"select" | "upload">(activeTab || "select");

  const currentActiveTab = onTabChange ? activeTab : internalActiveTab;
  const handleTabChange = onTabChange || setInternalActiveTab;
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState(() => ({
    ...actualDefaultFilters,
    file_type: initialFileType || actualDefaultFilters.file_type,
  }));
  const [searchTerm, setSearchTerm] = useState<string>(filters.search || '');
  const debouncedSearch = useDebounceValue(searchTerm, 500);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMedia, setSelectedMedia] = useState<Record<string | number, Media>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { hasModuleAction } = useUserPermissions();
  const canUploadMediaLegacy = hasModuleAction('media', 'create');
  const canUploadInMediaLibrary = useHasAccess('media.upload');
  const canUploadMedia = useMemo(() => {
    if (context === 'media_library') {
      return canUploadInMediaLibrary || canUploadMediaLegacy;
    }
    if (context === 'portfolio' || context === 'blog' || context === 'real_estate') {
      return true;
    }
    return canUploadInMediaLibrary || canUploadMediaLegacy;
  }, [context, canUploadInMediaLibrary, canUploadMediaLegacy]);

  const {
    files,
    isUploading,
    uploadSettings,
    validationErrors,
    processFiles,
    updateFileMetadata,
    removeFile,
    removeCoverFile,
    uploadFiles,
    clearFiles
  } = useMediaUpload(context, contextId);

  const isLoadingSettings = false;

  const fetchMedia = useCallback(async (currentFilters: typeof filters, _forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    const apiFilters: MediaFilter = {
      search: currentFilters.search || undefined,
      file_type: currentFilters.file_type === 'all' || currentFilters.file_type === undefined ? undefined : currentFilters.file_type,
      page: currentFilters.page,
      size: currentFilters.limit || DEFAULT_MEDIA_PAGE_SIZE,
      ordering: currentFilters.ordering,
    };

    try {
      const response = await mediaApi.getMediaList(apiFilters);

      if (response.metaData.status === 'success') {
        const mediaData = Array.isArray(response.data) ? response.data : [];
        setMediaItems(mediaData);
        setTotalCount(response.pagination?.count || mediaData.length || 0);
      } else {
        setError(response.metaData.message || "Failed to fetch media");
        setMediaItems([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setMediaItems([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch, filters.search]);

  useEffect(() => {
    if (isOpen) {
      setFilters(prev => ({
        ...prev,
        file_type: initialFileType || "all",
        page: 1,
        search: ""
      }));
      setSearchTerm("");
      fetchMedia({
        ...actualDefaultFilters,
        file_type: initialFileType || "all",
      }, true);
    }
  }, [isOpen, initialFileType, fetchMedia]);

  const handlePageChange = useCallback((newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleFileTypeChange = useCallback((newType: string) => {
    setFilters(prev => ({
      ...prev,
      file_type: newType,
      page: 1
    }));
  }, []);

  const handleSelectMedia = (item: Media) => {
    setSelectedMedia(prev => {
      const newSelection = { ...prev };
      if (newSelection[item.id]) {
        delete newSelection[item.id];
      } else {
        if (!selectMultiple) {
          return { [item.id]: item };
        }
        newSelection[item.id] = item;
      }
      return newSelection;
    });
  };

  const handleConfirmSelection = () => {
    const selectedArray = Object.values(selectedMedia);
    if (selectedArray.length === 0) {
      onClose();
      return;
    }

    if (selectMultiple) {
      onSelect(selectedArray);
    } else {
      onSelect(selectedArray[0]);
    }
    setSelectedMedia({});
    onClose();
  };

  const handleCoverFileChange = useCallback((event: ChangeEvent<HTMLInputElement>, mediaFileId: string) => {
    const selectedCoverFile = event.target.files?.[0];
    if (!selectedCoverFile) return;

    const fileCategory = mediaService.getFileCategory(selectedCoverFile);
    if (fileCategory !== 'image') {
      showError("کاور باید یک تصویر باشد");
      return;
    }

    if (!uploadSettings?.sizeLimit?.image || selectedCoverFile.size > uploadSettings.sizeLimit.image) {
      const maxSize = uploadSettings?.sizeLimitFormatted?.image || 'نامشخص';
      showError(`حجم فایل کاور بیش از حد مجاز است (${maxSize})`);
      return;
    }

    updateFileMetadata(mediaFileId, 'coverFile', selectedCoverFile);
  }, [uploadSettings, updateFileMetadata]);

  const handleUpload = async () => {
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    const result = await uploadFiles();

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (result.successCount === result.totalCount && result.successCount > 0) {
      clearFiles();
      setTimeout(() => {
        onUploadComplete?.();
        handleTabChange("select");
        setUploadProgress(0);
        setTimeout(() => {
          fetchMedia(filters, true);
        }, 1000);
      }, 1500);
    } else if (result.successCount > 0) {
      clearFiles();
      setTimeout(() => {
        onUploadComplete?.();
        handleTabChange("select");
        setUploadProgress(0);
        setTimeout(() => {
          fetchMedia(filters, true);
        }, 1000);
      }, 1500);
    }
  };

  const handleMediaUpdated = (updatedMedia: Media) => {
    setMediaItems(prev => prev.map(item =>
      item.id === updatedMedia.id ? updatedMedia : item
    ));

    if (detailMedia && detailMedia.id === updatedMedia.id) {
      setDetailMedia(updatedMedia);
    }
  };

  const handleEditMedia = () => {
    setIsDetailModalOpen(false);
  };

  const selectedIds = Object.keys(selectedMedia);

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'audio':
        return <FileAudio className="h-4 w-4" />;
      case 'document':
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const dialogContent = (
    <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0" showCloseButton={false}>
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
              variant={currentActiveTab === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabChange("select")}
              className="flex gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              انتخاب از کتابخانه
            </Button>
            {canUploadMedia && (
              <Button
                variant={currentActiveTab === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => handleTabChange("upload")}
                className="flex gap-2"
              >
                <Upload className="h-4 w-4" />
                آپلود فایل جدید
              </Button>
            )}
          </div>
        </div>
      )}

      {currentActiveTab === "upload" ? (
        <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="px-6 space-y-3">
              {isLoadingSettings ? (
                <div className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-font-s">در حال بارگذاری تنظیمات...</p>
                </div>
              ) : (
                <>
                  <FileDropzone
                    onFilesAdded={(files) => {
                      if (!canUploadMedia) {
                        showError("اجازه آپلود رسانه را ندارید");
                        return;
                      }
                      if (isLoadingSettings) {
                        showWarning('لطفا صبر کنید تا تنظیمات بارگذاری شود');
                        return;
                      }
                      processFiles(files);
                    }}
                    allowedTypes={uploadSettings?.allowedTypes || { image: [], video: [], audio: [], document: [] }}
                    disabled={isUploading || !canUploadMedia || isLoadingSettings}
                  />

                  {validationErrors && validationErrors.length > 0 && (
                    <div className="bg-red-0 border border-red-1/30 p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-1 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-red-1">خطا در آپلود فایل:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-1/80">
                            {validationErrors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
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
              <div className="px-6 space-y-2">
                <div className="flex justify-between text-sm text-font-s">
                  <span>در حال آپلود...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {files.length > 0 && (
              <div className="px-6">
                <FileList
                  files={files}
                  activeTab="upload"
                  onTabChange={() => { }}
                  onRemoveFile={removeFile}
                  onUpdateMetadata={updateFileMetadata}
                  onCoverFileChange={handleCoverFileChange}
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
                  <Button variant="outline" onClick={() => handleTabChange("select")} disabled={isUploading}>
                    انصراف
                  </Button>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || files.length === 0}
                  className="flex gap-2"
                >
                  {isUploading && <Loader2 className="animate-spin" />}
                  {isUploading ? "در حال آپلود..." : `آپلود ${files.length} فایل`}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 px-4 py-2 border-b">
            <Input
              type="text"
              placeholder="جستجو در رسانه‌ها..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            <div className="flex gap-2 mb-4">
              <Select value={filters.file_type || "all"} onValueChange={handleFileTypeChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه انواع</SelectItem>
                  <SelectItem value="image">تصویر</SelectItem>
                  <SelectItem value="video">ویدئو</SelectItem>
                  <SelectItem value="audio">صوتی</SelectItem>
                  <SelectItem value="pdf">سند</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-grow p-4 overflow-auto">
            {error && (
              <div className="text-center text-red-1 p-4">{error}</div>
            )}
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={`media-skeleton-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent"
                  >
                    <Skeleton className="h-full w-full" />
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center text-font-s py-10">
                <ImageOff className="mx-auto h-12 w-12" />
                <p className="mt-4">No media items found matching filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                {mediaItems.map((item) => {
                  const isSelected = !!selectedMedia[item.id];
                  const displayName = item.title || item.original_file_name || item.file_name || 'Untitled';

                  return (
                    <div
                      key={`media-item-${item.media_type}-${item.id}`}
                      className={cn(
                        "relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                        isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-font-s/50"
                      )}
                      onClick={() => handleSelectMedia(item)}
                      role="button"
                      aria-pressed={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectMedia(item); }}
                    >
                      <div className="relative w-full h-full">
                        <MediaPreview
                          media={item}
                          className="h-full"
                          showPlayIcon={true}
                        />
                      </div>
                      <div className={cn(
                        "absolute top-1.5 right-1.5 z-10 p-0.5 rounded-full transition-colors",
                        isSelected ? "bg-primary text-static-w" : "bg-card/60 text-font-s group-hover:bg-card"
                      )}>
                        {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </div>
                      <div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 p-1 text-[10px] z-0 transition-opacity duration-300 bg-gradient-to-t from-black/70 to-transparent pointer-events-none",
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {getMediaTypeIcon(item.media_type || "")}
                          <p className="font-medium truncate text-static-w" title={displayName}>{displayName}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totalCount > filters.limit && !isLoading && (
            <div className="px-4 py-2 border-t">
              <PaginationControls
                currentPage={filters.page}
                totalPages={Math.ceil(totalCount / (filters.limit || DEFAULT_MEDIA_PAGE_SIZE))}
                onPageChange={handlePageChange}
                pageSize={filters.limit || DEFAULT_MEDIA_PAGE_SIZE}
                onPageSizeChange={(newLimit) => {
                  setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
                }}
                pageSizeOptions={[12, 24, 36, 48]}
                showPageSize={true}
                showInfo={true}
                selectedCount={selectedIds.length}
                totalCount={totalCount}
                infoText={`${selectedIds.length} از ${totalCount} انتخاب شده`}
                showFirstLast={true}
                showPageNumbers={true}
              />
            </div>
          )}

          <DialogFooter className="p-4 border-t">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => { setSelectedMedia({}); onClose(); }}>انصراف</Button>
            </DialogClose>
            <Button onClick={handleConfirmSelection} disabled={selectedIds.length === 0}>
              {`انتخاب ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );

  return (
    <>
      {isOpen ? (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          {dialogContent}
        </Dialog>
      ) : null}

      <MediaDetailsModal
        media={detailMedia}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEditMedia}
        showEditButton={true}
        onMediaUpdated={handleMediaUpdated}
      />
    </>
  );
}