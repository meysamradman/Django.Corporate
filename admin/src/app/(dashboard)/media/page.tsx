'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from '@/core/hooks/useDebounce';
import { mediaApi, VALID_MEDIA_PAGE_SIZES, DEFAULT_MEDIA_PAGE_SIZE } from '@/api/media/route';
import { Media, MediaFilter } from '@/types/shared/media';
import { MediaImage } from '@/components/media/base/MediaImage';
import { Input } from '@/components/elements/Input';
import { mediaService } from '@/components/media/services';
import { Button } from '@/components/elements/Button';
import { PaginationControls } from '@/components/shared/Pagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/elements/Pagination";
import { ImageOff, Trash2, Upload, Search, ChevronRight, ChevronLeft, Filter, X, Play, FileAudio } from 'lucide-react';
import { TableLoadingCompact } from '@/components/elements/TableLoading';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/elements/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/elements/DropdownMenu";
import { Checkbox } from '@/components/elements/Checkbox';
import { toast } from 'sonner';
import { usePermissions } from '@/core/auth/permissionUtils';
import { cn } from '@/core/utils/cn';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/elements/AlertDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/elements/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/elements/Select"
import { MediaUploadModal } from '@/components/media/modals/MediaUploadModal';
import { MediaDetailsModal } from '@/components/media/modals/MediaDetailsModal';
import { AIImageGenerator } from '@/components/media/ai/AIImageGenerator';
import { Sparkles } from 'lucide-react';

const actualDefaultFilters: MediaFilter = {
    search: "",
    file_type: "all",
    page: 1,
    size: 12,
    date_from: "",
    date_to: "",
};

export default function MediaPage() {
  const router = useRouter();

  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState<MediaFilter>(actualDefaultFilters);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItems, setSelectedItems] = useState<Record<string | number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void; }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  const fetchMedia = useCallback(async (currentFilters: MediaFilter) => {
    setIsLoading(true);
    setError(null);

    const apiFilters: MediaFilter = {
      search: currentFilters.search || undefined,
      file_type: currentFilters.file_type === "all" ? undefined : currentFilters.file_type,
      page: currentFilters.page,
      size: currentFilters.size,
      date_from: currentFilters.date_from || undefined,
      date_to: currentFilters.date_to || undefined,
    };

    try {
      const response = await mediaApi.getMediaList(apiFilters);
      
      if (response.metaData.status === 'success') {
        // Ensure we're getting the data correctly from the response
        const mediaData = Array.isArray(response.data) ? response.data : [];
        setMediaItems(mediaData);
        setTotalCount(response.pagination?.count || mediaData.length || 0);
      } else {
          setError(response.metaData.message || "خطا در دریافت رسانه‌ها");
      }
    } catch (error) {
      // Error fetching media handled by toast
      setError("خطا در دریافت رسانه‌ها");
      setMediaItems([]); // Clear items on error
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters: Partial<MediaFilter> = {};
    
    if (urlParams.get('search')) urlFilters.search = urlParams.get('search')!;
    if (urlParams.get('file_type')) urlFilters.file_type = urlParams.get('file_type')!;
    if (urlParams.get('date_from')) urlFilters.date_from = urlParams.get('date_from')!;
    if (urlParams.get('date_to')) urlFilters.date_to = urlParams.get('date_to')!;
    if (urlParams.get('page')) urlFilters.page = parseInt(urlParams.get('page')!, 10);
    if (urlParams.get('limit')) urlFilters.size = parseInt(urlParams.get('limit')!, 10);
    
    if (Object.keys(urlFilters).length > 0) {
      const newFilters = { ...actualDefaultFilters, ...urlFilters };
      setFilters(newFilters);
      fetchMedia(newFilters);
    } else {
      fetchMedia(actualDefaultFilters);
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const debouncedSearch = useDebounce((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
    
    const url = new URL(window.location.href);
    if (searchTerm) {
      url.searchParams.set('search', searchTerm);
    } else {
      url.searchParams.delete('search');
    }
    url.searchParams.set('page', '1');
    window.history.replaceState({}, '', url.toString());
  }, 500);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.history.replaceState({}, '', url.toString());
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, size: newLimit, page: 1 }));
    
    const url = new URL(window.location.href);
    url.searchParams.set('limit', newLimit.toString());
    url.searchParams.set('page', '1');
    window.history.replaceState({}, '', url.toString());
  };

  const handleFileTypeChange = (fileType: string) => {
    setFilters(prev => ({ ...prev, file_type: fileType === "all" ? "all" : fileType, page: 1 }));
    
    const url = new URL(window.location.href);
    url.searchParams.set('file_type', fileType);
    url.searchParams.set('page', '1');
    window.history.replaceState({}, '', url.toString());
  };

  const handleDateFromChange = (date: string) => {
    setFilters(prev => ({ ...prev, date_from: date, page: 1 }));
    
    const url = new URL(window.location.href);
    url.searchParams.set('date_from', date);
    url.searchParams.set('page', '1');
    window.history.replaceState({}, '', url.toString());
  };

  const handleDateToChange = (date: string) => {
    setFilters(prev => ({ ...prev, date_to: date, page: 1 }));
    
    const url = new URL(window.location.href);
    url.searchParams.set('date_to', date);
    url.searchParams.set('page', '1');
    window.history.replaceState({}, '', url.toString());
  };

  const clearFilters = () => {
    setFilters(actualDefaultFilters);
    
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    url.searchParams.delete('file_type');
    url.searchParams.delete('date_from');
    url.searchParams.delete('date_to');
    url.searchParams.set('page', '1');
    url.searchParams.set('limit', actualDefaultFilters.size.toString());
    window.history.replaceState({}, '', url.toString());
  };

  const hasActiveFilters = filters.search || filters.file_type !== "all" || filters.date_from || filters.date_to;

  const handleSelectItem = (itemId: number, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelection: Record<string | number, boolean> = {};
       if (checked) {
           mediaItems.forEach(item => newSelection[item.id] = true);
       }
       setSelectedItems(newSelection);
  };

  const selectedIds = Object.keys(selectedItems);
  const allSelected = mediaItems.length > 0 && selectedIds.length === mediaItems.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleDeleteSelected = async () => {
      // Get the selected media items
      const selectedMediaItems = mediaItems.filter(item => selectedItems[item.id]);
      
      if (selectedMediaItems.length === 0) return;

      setConfirmDialog({
          open: true,
          title: `حذف ${selectedMediaItems.length} رسانه`,
          description: "آیا مطمئن هستید که می‌خواهید رسانه‌های انتخاب شده را حذف کنید؟ این عملیات قابل بازگشت نیست (حذف نرم به صورت پیش‌فرض).",
          onConfirm: async () => {
              setConfirmDialog(prev => ({ ...prev, open: false }));
              
              toast.promise(
                  mediaApi.bulkDeleteMedia(selectedMediaItems),
                  {
                      loading: 'در حال حذف رسانه‌ها...',
                      success: (response) => {
                          fetchMedia(filters);
                          setSelectedItems({});
                          return `${response.data?.deleted_count || selectedMediaItems.length} رسانه برای حذف علامت‌گذاری شد.`;
                      },
                      error: (error) => {
                           return error instanceof Error ? error.message : 'خطا در حذف رسانه‌ها.';
                      },
                  }
              );
          }
      });
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };
  
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);

  const handleUploadComplete = () => {
    // Refresh media list after upload
    fetchMedia(filters);
  };

  const handleMediaClick = (media: Media) => {
    setDetailMedia(media);
    setDetailModalOpen(true);
  };

  const handleEditMedia = (media: Media) => {
    // For now, just close the detail modal
    setDetailModalOpen(false);
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
    
    // Toast is shown in MediaDetailsModal - no need to show again here
  };

  useEffect(() => {
    fetchMedia(filters);
  }, [fetchMedia, filters]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>کتابخانه رسانه</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsAIGenerateModalOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            تولید با AI
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleUploadClick}
          >
            <Upload className="mr-2 h-4 w-4" />
            آپلود رسانه
          </Button>
        </div>
      </div>

      {/* Main Content */}

      {error && (
           <div className="text-center text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded">
               <p>{error}</p>
           </div>
      )}

        <Card className="gap-0 shadow-sm border-0">
          <CardHeader className="border-b border-border">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected || (someSelected ? 'indeterminate' : false)}
                    onCheckedChange={handleSelectAll}
                    aria-label="انتخاب همه موارد این صفحه"
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-muted-foreground">انتخاب همه</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو..."
                    defaultValue={filters.search}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {selectedIds.length > 0 && (
                  <Button variant="destructive" onClick={handleDeleteSelected} size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    حذف ({selectedIds.length})
                  </Button>
                )}
              </div>

              <div className="flex flex-col flex-wrap gap-2 md:flex-row md:items-center md:gap-2">
                <Select
                  value={filters.file_type}
                  onValueChange={handleFileTypeChange}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue placeholder="نوع فایل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    <SelectItem value="image">تصویر</SelectItem>
                    <SelectItem value="video">ویدیو</SelectItem>
                    <SelectItem value="audio">صوت</SelectItem>
                    <SelectItem value="pdf">مستند</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="h-8 w-36"
                    placeholder="از تاریخ"
                  />
                  <span className="text-xs text-muted-foreground">تا</span>
                  <Input
                    type="date"
                    value={filters.date_to || ''}
                    onChange={(e) => handleDateToChange(e.target.value)}
                    className="h-8 w-36"
                    placeholder="تا تاریخ"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <TableLoadingCompact />
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageOff className="h-16 w-16 mb-4" />
                <p className="text-lg">رسانه‌ای یافت نشد</p>
                <p className="text-sm mt-1">آپلود رسانه جدید یا تغییر فیلترها</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 p-6">
                {mediaItems.map((item) => {
                  const displayName = item.title || item.original_file_name || item.file_name || 'بدون عنوان';
                  
                  // Use the shared service to get cover image URL
                  const coverImageUrl = mediaService.getMediaCoverUrl(item);
                  const hasCoverImage = !!coverImageUrl && coverImageUrl.length > 0;

                  return (
                    <Card 
                      key={`media-item-${item.media_type}-${item.id}`}
                      className={cn(
                        "overflow-hidden group relative transition-all border-2 cursor-pointer hover:shadow-lg p-0",
                        selectedItems[item.id] ? "border-primary shadow-md" : "border-transparent hover:border-muted-foreground/20"
                      )}
                      onClick={() => handleMediaClick(item)}
                    >
                      {/* Image Container */}
                      <div className="w-full h-48 flex items-center justify-center bg-muted relative overflow-hidden">
                        {hasCoverImage ? (
                          <MediaImage
                            media={item}
                            src={coverImageUrl}
                            alt={item.alt_text || item.title || 'تصویر رسانه'}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
                          />
                        ) : item.media_type === 'image' && item.file_url ? (
                          <MediaImage
                            media={item}
                            src={item.file_url || ''}
                            alt={item.alt_text || item.title || 'تصویر رسانه'}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center w-full h-full">
                            <ImageOff className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground capitalize">
                              {item.media_type === 'video' ? 'ویدیو' : item.media_type === 'audio' ? 'صوت' : item.media_type}
                            </span>
                          </div>
                        )}
                        
                        {/* Video/Audio icon overlay */}
                        {(item.media_type === 'video' || item.media_type === 'audio') && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 rounded-full p-3">
                              {item.media_type === 'video' ? (
                                <Play className="h-6 w-6 text-white" />
                              ) : (
                                <FileAudio className="h-6 w-6 text-white" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Checkbox - Top Right */}
                      <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          id={`select-${item.id}`}
                          checked={!!selectedItems[item.id]}
                          onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                          aria-label={`انتخاب ${item.title || 'رسانه'}`}
                          className="bg-background/90 border-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </div>

                      {/* Title Overlay - Bottom */}
                      <div className={cn(
                        "absolute bottom-0 left-0 right-0 p-3 text-xs z-0 transition-all duration-300 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none",
                        selectedItems[item.id] ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <p className="truncate drop-shadow-lg text-white" title={displayName}>{displayName}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>

          {!isLoading && mediaItems.length > 0 && (
            <CardFooter className="border-t border-border">
              <PaginationControls
                currentPage={filters.page || 1}
                totalPages={Math.ceil(totalCount / (filters.size ?? DEFAULT_MEDIA_PAGE_SIZE))}
                onPageChange={handlePageChange}
                pageSize={filters.size || DEFAULT_MEDIA_PAGE_SIZE}
                onPageSizeChange={handleLimitChange}
                pageSizeOptions={[12, 24, 36, 48]}
                showPageSize={true}
                showInfo={true}
                selectedCount={selectedIds.length}
                totalCount={totalCount}
                infoText={`${((filters.page || 1) - 1) * (filters.size || DEFAULT_MEDIA_PAGE_SIZE) + 1} - ${Math.min((filters.page || 1) * (filters.size || DEFAULT_MEDIA_PAGE_SIZE), totalCount)} از ${totalCount}`}
                showFirstLast={true}
                showPageNumbers={true}
              />
            </CardFooter>
          )}
        </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"> 
              تأیید حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MediaUploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* AI Generate Modal */}
      <Dialog open={isAIGenerateModalOpen} onOpenChange={setIsAIGenerateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تولید تصویر با AI</DialogTitle>
          </DialogHeader>
          <AIImageGenerator
            onImageGenerated={(media) => {
              fetchMedia(filters);
              setIsAIGenerateModalOpen(false);
            }}
            onSelectGenerated={(media) => {
              handleMediaClick(media);
              setIsAIGenerateModalOpen(false);
            }}
            onNavigateToSettings={() => {
              setIsAIGenerateModalOpen(false);
              router.push('/settings/ai');
            }}
          />
        </DialogContent>
      </Dialog>

      <MediaDetailsModal
        media={detailMedia}
        isOpen={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onEdit={handleEditMedia}
        showEditButton={true}
        onMediaUpdated={handleMediaUpdated}
      />
    </div>
  );
}