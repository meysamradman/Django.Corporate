"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/elements/Dialog";
import { Button } from "@/components/elements/Button";
import { Progress } from "@/components/elements/Progress";
import { mediaApi, DEFAULT_MEDIA_PAGE_SIZE, VALID_MEDIA_PAGE_SIZES } from '@/api/media/route';
import { MediaFilter } from '@/types/shared/media';
import { Media } from '@/types/shared/media';
import { MediaPreview } from '@/components/media/base/MediaPreview';
import { MediaThumbnail } from '@/components/media/base/MediaThumbnail';
import { Input } from '@/components/elements/Input';
import { PaginationControls } from '@/components/shared/Pagination';
import { ImageOff, CheckSquare, Square, FolderOpen, Upload, Loader2, X, Play, FileAudio, FileText } from 'lucide-react';
import { TableLoadingCompact } from '@/components/elements/TableLoading';
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
import { toast } from "@/components/elements/Sonner";
import { mediaService } from '@/components/media/services';
import { Card, CardContent } from "@/components/elements/Card";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaDetailsModal } from '@/components/media/modals/MediaDetailsModal';

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
}: MediaLibraryModalProps) {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState(() => ({
      ...actualDefaultFilters,
      file_type: initialFileType || actualDefaultFilters.file_type,
  }));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMedia, setSelectedMedia] = useState<Record<string | number, Media>>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Upload functionality
  const {
    files,
    isUploading,
    uploadSettings,
    processFiles,
    updateFileMetadata,
    removeFile,
    removeCoverFile,
    uploadFiles,
    clearFiles
  } = useMediaUpload();

  const fetchMedia = useCallback(async (currentFilters: typeof filters) => {
    setIsLoading(true);
    setError(null);

    const apiFilters: MediaFilter = {
      search: currentFilters.search || undefined,
      file_type: currentFilters.file_type === 'all' || currentFilters.file_type === undefined ? undefined : currentFilters.file_type,
      page: currentFilters.page,
      size: currentFilters.limit || DEFAULT_MEDIA_PAGE_SIZE,
      ordering: currentFilters.ordering,
    };

    console.log('Sending filters to API:', apiFilters);

    try {
      const response = await mediaApi.getMediaList(apiFilters, {
        cache: 'no-store',
      });
      
      console.log('API Response:', response);
      
      if (response.metaData.status === 'success') {
        // Ensure we're getting the data correctly from the response
        const mediaData = Array.isArray(response.data) ? response.data : [];
        setMediaItems(mediaData);
        setTotalCount(response.pagination?.count || mediaData.length || 0);
      } else {
        setError(response.metaData.message || "Failed to fetch media");
        setMediaItems([]);
        setTotalCount(0);
      }
    } catch (err) {
      // Error fetching admin media handled silently
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setMediaItems([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMedia(filters);
    }
  }, [filters, fetchMedia, isOpen]);


  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };


  const handleFileTypeChange = (newType: string) => {
      setFilters(prev => ({ 
        ...prev, 
        file_type: newType, 
        page: 1 
      }));
  };

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

  const handleCoverFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, mediaFileId: string) => {
    const selectedCoverFile = event.target.files?.[0];
    if (!selectedCoverFile) return;
    
    const fileCategory = mediaService.getFileCategory(selectedCoverFile);
    if (fileCategory !== 'image') {
      toast.error("کاور باید یک تصویر باشد");
      return;
    }

    if (selectedCoverFile.size > uploadSettings.sizeLimit.image) {
      toast.error(`حجم فایل کاور بیش از حد مجاز است (${uploadSettings.sizeLimitFormatted.image})`);
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
      setTimeout(() => {
        onUploadComplete?.();
        onTabChange?.("select");
        setUploadProgress(0);
        clearFiles();
        // Refresh media list after upload
        fetchMedia(filters);
      }, 1500);
    }
  };

  const handleMediaUpdated = (updatedMedia: Media) => {
    // Update the media item in the list
    setMediaItems(prev => prev.map(item => 
      item.id === updatedMedia.id ? updatedMedia : item
    ));
    
    // Also update the detail media if it's the same item
    if (detailMedia && detailMedia.id === updatedMedia.id) {
      setDetailMedia(updatedMedia);
    }
    
    // Removed duplicate toast notification to prevent showing two toasts
    // The MediaDetailsModal already shows a toast notification
  };

  const handleMediaClick = (media: Media) => {
    // Open media details modal
    setDetailMedia(media);
    setIsDetailModalOpen(true);
  };

  const handleEditMedia = (media: Media) => {
    // For now, just close the detail modal
    setIsDetailModalOpen(false);
    // In a real implementation, you would open an edit modal here
    console.log('Edit media:', media);
  };

  const selectedIds = Object.keys(selectedMedia);

  // Get icon for media type
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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0" showCloseButton={false} aria-describedby="media-library-description">
          <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between">
                  <div className="flex items-center">
                      <DialogTitle>انتخاب از کتابخانه رسانه</DialogTitle>
                  </div>
                  <div className="flex items-center">
                      <DialogClose asChild>
                          <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 cursor-pointer hover:bg-muted-foreground/10"
                          >
                              <X className="h-4 w-4" />
                          </Button>
                      </DialogClose>
                  </div>
              </div>
          </DialogHeader>
          
          {/* Hidden description for accessibility */}
          <div id="media-library-description" className="sr-only">
            کتابخانه رسانه برای انتخاب فایل‌های موجود یا آپلود فایل جدید استفاده می‌شود.
          </div>

          {/* Tabs */}
          {showTabs && (
            <div className="border-b border-border">
              <div className="flex space-x-1 px-4 py-2">
                <Button
                  variant={activeTab === "select" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange?.("select")}
                  className="flex gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  انتخاب از کتابخانه
                </Button>
                <Button
                  variant={activeTab === "upload" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange?.("upload")}
                  className="flex gap-2"
                >
                  <Upload className="h-4 w-4" />
                  آپلود فایل جدید
                </Button>
              </div>
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === "upload" ? (
            <div className="flex-grow flex flex-col">
              {/* Upload Content */}
              <div className="space-y-6 py-4 flex-grow">
                {/* File Dropzone */}
                <div className="px-6">
                  <FileDropzone 
                    onFilesAdded={processFiles}
                    allowedTypes={uploadSettings.allowedTypes}
                    disabled={isUploading}
                  />
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="px-6 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>در حال آپلود...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )

}

                {/* File List */}
                {files.length > 0 && (
                  <div className="px-6">
                    <FileList
                      files={files}
                      activeTab="upload"
                      onTabChange={() => {}}
                      onRemoveFile={removeFile}
                      onUpdateMetadata={updateFileMetadata}
                      onCoverFileChange={handleCoverFileChange}
                      onRemoveCoverFile={removeCoverFile}
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>

              {/* Upload Footer */}
              {files.length > 0 && (
                <div className="bg-muted/50 border-t border-border px-6 py-4">
                  <div className="flex gap-3 justify-between">
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => onTabChange?.("select")} disabled={isUploading}>
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
                      value={filters.search || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
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
                      <div className="text-center text-red-600 p-4">{error}</div>
                  )}
                  {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                          <TableLoadingCompact />
                      </div>
                  ) : mediaItems.length === 0 ? (
                      <div className="text-center text-muted-foreground py-10">
                          <ImageOff className="mx-auto h-12 w-12" />
                          <p className="mt-4">No media items found matching filters.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-3">
                          {mediaItems.map((item) => {
                              const isSelected = !!selectedMedia[item.id];
                              const displayName = item.title || item.original_file_name || item.file_name || 'Untitled';
                              
                              // Use the shared service to get cover image URL
                              const coverImageUrl = mediaService.getMediaCoverUrl(item);
                              
                              // Create a modified media object with cover image URL if available
                              const mediaWithCover = coverImageUrl ? {...item, file_url: coverImageUrl} : item;

                              return (
                                  <div
                                      key={item.id}
                                      className={cn(
                                          "relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                                          isSelected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent hover:border-muted-foreground/50"
                                      )}
                                      onClick={() => handleSelectMedia(item)}
                                      role="button"
                                      aria-pressed={isSelected}
                                      tabIndex={0}
                                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectMedia(item); }}
                                  >
                                      <div className="relative w-full h-full">
                                          <MediaPreview
                                              media={mediaWithCover}
                                              className="h-full"
                                              showPlayIcon={true}
                                          />
                                      </div>
                                      <div className={cn(
                                          "absolute top-1.5 right-1.5 z-10 p-0.5 rounded-full transition-colors",
                                          isSelected ? "bg-primary text-primary-foreground" : "bg-background/60 text-muted-foreground group-hover:bg-background"
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
                                            {getMediaTypeIcon(item.media_type)}
                                            <p className="font-medium truncate text-white" title={displayName}>{displayName}</p>
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
                     <Button variant="outline" onClick={() => {setSelectedMedia({}); onClose();}}>انصراف</Button>
                 </DialogClose>
                  <Button onClick={handleConfirmSelection} disabled={selectedIds.length === 0}>
                      {`انتخاب ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
                  </Button>
              </DialogFooter>
            </>
          )}
      </DialogContent>
  );

  const handleUploadComplete = () => {
    // Refresh media list after upload
    fetchMedia(filters);
    onUploadComplete?.();
  };

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