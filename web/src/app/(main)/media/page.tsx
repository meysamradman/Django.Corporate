'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDebounce } from '@/core/hooks/useDebounce';
import { mediaApi, VALID_MEDIA_PAGE_SIZES, DEFAULT_MEDIA_PAGE_SIZE } from '@/api/media/route';
import { Media, MediaFilter } from '@/types/shared/media';
import { MediaImage } from '@/components/media/base/MediaImage';
import { Skeleton } from "@/components/elements/Skeleton";
const MediaGridSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 p-6">
    {Array.from({ length: 10 }).map((_, index) => (
      <Card 
        key={`media-skeleton-${index}`} 
        className="overflow-hidden border-2 border-transparent hover:border-font-s/20 p-0 group relative transition-all"
      >
        <div className="w-full h-48 flex items-center justify-center bg-bg relative overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="absolute top-2 right-2 z-10">
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </Card>
    ))}
  </div>
);
import { Input } from '@/components/elements/Input';
import { mediaService } from '@/components/media/services';
import { Button } from '@/components/elements/Button';
import ProtectedButton from '@/core/permissions/components/ProtectedButton';
import { PaginationControls } from '@/components/shared/Pagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/elements/Pagination";
import { ImageOff, Trash2, Upload, Search, ChevronRight, ChevronLeft, Filter, X, Play, FileAudio } from 'lucide-react';
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
import { toast } from '@/components/elements/Sonner';
import { useUserPermissions } from '@/core/permissions/hooks/useUserPermissions';
import { useHasAccess } from '@/core/permissions/hooks/useHasAccess';
import { useCanUpload } from '@/core/permissions/hooks/useCanUpload';
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
import { Loader } from '@/components/elements/Loader';

const MediaUploadModal = dynamic(
  () => import('@/components/media/modals/MediaUploadModal').then(mod => ({ default: mod.MediaUploadModal })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><Loader /></div> }
);

const MediaDetailsModal = dynamic(
  () => import('@/components/media/modals/MediaDetailsModal').then(mod => ({ default: mod.MediaDetailsModal })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><Loader /></div> }
);

const AIImageGenerator = dynamic(
  () => import('@/components/ai/image').then(mod => ({ default: mod.AIImageGenerator })),
  { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><Loader /></div> }
);
import { Sparkles } from 'lucide-react';
import { PersianDatePicker } from '@/components/elements/PersianDatePicker';

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
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void; }>({ open: false, title: "", description: "", onConfirm: () => { } });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { getResourceAccess, hasModuleAction } = useUserPermissions();
  const mediaAccess = getResourceAccess('media');
  const canUploadMedia = useCanUpload('media_library');
  const aiAccess = getResourceAccess('ai');
  const canDeleteMedia = mediaAccess.delete || mediaAccess.manage;
  const canUseAI = hasModuleAction('ai', 'create');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMedia = useCallback(async (currentFilters: MediaFilter, forceRefresh: boolean = false) => {
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
      const response = await mediaApi.getMediaList(apiFilters, forceRefresh ? {
        forceRefresh: true
      } : undefined);

      if (response.metaData.status === 'success') {
        const mediaData = Array.isArray(response.data) ? response.data : [];
        setMediaItems(mediaData);
        setTotalCount(response.pagination?.count || mediaData.length || 0);
      } else {
        setError(response.metaData.message || "خطا در دریافت رسانه‌ها");
      }
    } catch (error) {
      setError("خطا در دریافت رسانه‌ها");
      setMediaItems([]);
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
    if (!canDeleteMedia) {
      toast.error("شما اجازه حذف رسانه‌ها را ندارید");
      return;
    }
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
            success: (response: any) => {
              fetchMedia(filters);
              setSelectedItems({});
              return `${response.data?.deleted_count || selectedMediaItems.length} رسانه برای حذف علامت‌گذاری شد.`;
            },
            error: (error: any) => {
              return error instanceof Error ? error.message : 'خطا در حذف رسانه‌ها.';
            },
          }
        );
      }
    });
  };

  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);

  const handleAIGenerateClick = () => {
    setIsAIGenerateModalOpen(true);
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadComplete = () => {
    fetchMedia({ ...filters, page: 1 }, true);
  };

  const handleMediaClick = (media: Media) => {
    setDetailMedia(media);
    setDetailModalOpen(true);
  };

  const handleEditMedia = (media: Media) => {
    setDetailModalOpen(false);
  };

  const handleMediaUpdated = (updatedMedia: Media) => {
    setMediaItems(prev => prev.map(item =>
      item.id === updatedMedia.id ? updatedMedia : item
    ));

    if (detailMedia && detailMedia.id === updatedMedia.id) {
      setDetailMedia(updatedMedia);
    }
  };

  useEffect(() => {
    fetchMedia(filters);
  }, [fetchMedia, filters]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">کتابخانه رسانه</h1>
        </div>
        <div className="flex items-center gap-2">
          <ProtectedButton
            permission="ai.create"
            size="sm"
            className="border border-pink-1 bg-pink text-pink-2 shadow-sm transition hover:bg-pink/90"
            onClick={handleAIGenerateClick}
            showDenyToast={false}
          >
            <Sparkles className="h-4 w-4" />
            تولید با AI
          </ProtectedButton>

          <ProtectedButton
            permission={['media.upload', 'media.image.upload', 'media.video.upload', 'media.audio.upload', 'media.document.upload']}
            requireAll={false}
            size="sm"
            className="bg-primary text-static-w shadow-sm hover:shadow-md"
            onClick={handleUploadClick}
            showDenyToast={false}
          >
            <Upload className="h-4 w-4" />
            آپلود رسانه
          </ProtectedButton>
        </div>
      </div>

      {error && (
        <div className="text-center text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded">
          <p>{error}</p>
        </div>
      )}

      <Card className="gap-0 shadow-sm border-0">
        <CardHeader className="border-b">
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
                <span className="text-xs text-font-s">انتخاب همه</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-font-s" />
                <Input
                  placeholder="جستجو..."
                  defaultValue={filters.search}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedIds.length > 0 && (
                <ProtectedButton
                  permission="media.delete"
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف ({selectedIds.length})
                </ProtectedButton>
              )}
            </div>

            <div className="flex flex-col flex-wrap gap-2 md:flex-row md:items-center md:gap-2">
              {mounted && (
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
              )}

              <div className="flex items-center gap-2">
                <PersianDatePicker
                  value={filters.date_from || ''}
                  onChange={(date) => handleDateFromChange(date)}
                  placeholder="از تاریخ"
                  className="h-8 w-36"
                />
                <span className="text-xs text-font-s">تا</span>
                <PersianDatePicker
                  value={filters.date_to || ''}
                  onChange={(date) => handleDateToChange(date)}
                  placeholder="تا تاریخ"
                  className="h-8 w-36"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <MediaGridSkeleton />
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-font-s">
              <ImageOff className="h-16 w-16 mb-4" />
              <p className="text-lg">رسانه‌ای یافت نشد</p>
              <p className="text-sm mt-1">آپلود رسانه جدید یا تغییر فیلترها</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 p-6">
              {mediaItems.map((item) => {
                const displayName = item.title || item.original_file_name || item.file_name || 'بدون عنوان';

                const coverImageUrl = mediaService.getMediaCoverUrl(item);
                const hasCoverImage = !!coverImageUrl && coverImageUrl.length > 0;

                return (
                  <Card
                    key={`media-item-${item.media_type}-${item.id}`}
                    className={cn(
                      "overflow-hidden group relative transition-all border-2 cursor-pointer hover:shadow-lg p-0",
                      selectedItems[item.id] ? "border-primary shadow-md" : "border-transparent hover:border-font-s/20"
                    )}
                    onClick={() => handleMediaClick(item)}
                  >
                    <div className="w-full h-48 flex items-center justify-center bg-bg relative overflow-hidden">
                      {hasCoverImage ? (
                        <MediaImage
                          media={item}
                          src={coverImageUrl}
                          alt={item.alt_text || item.title || 'تصویر رسانه'}
                          fill
                          showSkeleton={false}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
                        />
                      ) : item.media_type === 'image' && item.file_url ? (
                        <MediaImage
                          media={item}
                          src={item.file_url || ''}
                          alt={item.alt_text || item.title || 'تصویر رسانه'}
                          fill
                          showSkeleton={false}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 16vw, 12.5vw"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                          <ImageOff className="h-8 w-8 text-font-s mb-2" />
                          <span className="text-xs text-font-s capitalize">
                            {item.media_type === 'video' ? 'ویدیو' : item.media_type === 'audio' ? 'صوت' : item.media_type}
                          </span>
                        </div>
                      )}

                      {(item.media_type === 'video' || item.media_type === 'audio') && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-static-b/50 rounded-full p-3">
                            {item.media_type === 'video' ? (
                              <Play className="h-6 w-6 text-static-w" />
                            ) : (
                              <FileAudio className="h-6 w-6 text-static-w" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={`select-${item.id}`}
                        checked={!!selectedItems[item.id]}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                        aria-label={`انتخاب ${item.title || 'رسانه'}`}
                        className="bg-card/90 border-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:text-static-w"
                      />
                    </div>

                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 p-3 text-xs z-0 transition-all duration-300 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none",
                      selectedItems[item.id] ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      <p className="truncate drop-shadow-lg text-static-w" title={displayName}>{displayName}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>

        {!isLoading && mediaItems.length > 0 && (
          <CardFooter className="border-t">
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
            <AlertDialogAction onClick={confirmDialog.onConfirm} className="bg-destructive text-static-w hover:bg-destructive/90">
              تأیید حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
        context="media_library"
      />

      {canUseAI && (
        <Dialog open={isAIGenerateModalOpen} onOpenChange={setIsAIGenerateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تولید تصویر با AI</DialogTitle>
            </DialogHeader>
            <AIImageGenerator
              compact={true}
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
      )}

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