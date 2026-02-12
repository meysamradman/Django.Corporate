import { useState, useEffect, lazy, Suspense } from 'react';
import { cleanupDateRangeFromURL } from '@/components/tables/utils/tableSorting';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { mediaApi, DEFAULT_MEDIA_PAGE_SIZE } from '@/api/media/media';
import type { Media, MediaFilter } from '@/types/shared/media';
import { Skeleton } from "@/components/elements/Skeleton";
import { PaginationControls } from '@/components/shared/paginations/PaginationControls';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/elements/Card";
import { toast, showError } from '@/core/toast';
import { useUserPermissions } from '@/core/permissions';
import { Loader } from '@/components/elements/Loader';
import { MediaPageFilters } from '@/components/media/page/MediaPageFilters';
import { MediaPageGrid } from '@/components/media/page/MediaPageGrid';
import { MediaPageHeaderActions } from '@/components/media/page/MediaPageHeaderActions';
import { MediaDeleteConfirmDialog } from '@/components/media/page/MediaDeleteConfirmDialog';
import { MediaAIGenerateDialog } from '@/components/media/page/MediaAIGenerateDialog';
import {
  parseMediaFiltersFromSearch,
  type MediaFiltersWithRange,
} from '@/components/media/page/mediaPageFilterUrl';
import { useMediaPageSelection } from '@/components/media/page/useMediaPageSelection';
import { useMediaPageData } from '@/components/media/page/useMediaPageData';
import { useMediaPageDialogs } from '@/components/media/page/useMediaPageDialogs';
import { useMediaPageFilters } from '@/components/media/page/useMediaPageFilters';

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
          <Skeleton className="h-5 w-5" />
        </div>
      </Card>
    ))}
  </div>
);

const MediaUploadModal = lazy(() => import('@/components/media/modals/MediaUploadModal').then(mod => ({ default: mod.MediaUploadModal })));
const MediaDetailsModal = lazy(() => import('@/components/media/modals/MediaDetailsModal').then(mod => ({ default: mod.MediaDetailsModal })));
const AIImageGenerator = lazy(() => import('@/components/ai/image').then(mod => ({ default: mod.AIImageGenerator })));

const actualDefaultFilters: MediaFilter = {
  search: "",
  file_type: "all",
  page: 1,
  size: 12,
  date_from: "",
  date_to: "",
};

export default function MediaPage() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<MediaFiltersWithRange>(actualDefaultFilters);
  const [mounted, setMounted] = useState(false);
  const {
    mediaItems,
    setMediaItems,
    totalCount,
    isLoading,
    error,
    fetchMedia,
  } = useMediaPageData();
  const { getResourceAccess, hasModuleAction } = useUserPermissions();
  const mediaAccess = getResourceAccess('media');
  const canDeleteMedia = mediaAccess.delete || mediaAccess.manage;
  const canUseAI = hasModuleAction('ai', 'create');
  const {
    confirmDialog,
    setConfirmDialog,
    closeConfirmDialog,
    isUploadModalOpen,
    openUploadModal,
    closeUploadModal,
    detailMedia,
    setDetailMedia,
    isDetailModalOpen,
    openDetailModal,
    closeDetailModal,
    isAIGenerateModalOpen,
    setIsAIGenerateModalOpen,
    openAIGenerateModal,
    closeAIGenerateModal,
  } = useMediaPageDialogs();
  const {
    selectedItems,
    selectedIds,
    allSelected,
    someSelected,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
  } = useMediaPageSelection(mediaItems);
  const {
    debouncedSearch,
    handlePageChange,
    handleLimitChange,
    handleFileTypeChange,
    handleDateRangeChange,
  } = useMediaPageFilters({ setFilters });

  useEffect(() => {
    setMounted(true);
  }, []);

  const location = useLocation();

  useEffect(() => {
    cleanupDateRangeFromURL();
    setFilters(parseMediaFiltersFromSearch(location.search, actualDefaultFilters));
  }, [location.search]);

  const handleDeleteSelected = async () => {
    if (!canDeleteMedia) {
      showError("شما اجازه حذف رسانه‌ها را ندارید");
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
              clearSelection();
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

  const handleAIGenerateClick = () => {
    openAIGenerateModal();
  };

  const handleUploadClick = () => {
    openUploadModal();
  };

  const handleUploadComplete = () => {
    fetchMedia({ ...filters, page: 1 });
  };

  const handleMediaClick = (media: Media) => {
    openDetailModal(media);
  };

  const handleEditMedia = () => {
    closeDetailModal();
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
      <PageHeader title="کتابخانه رسانه">
        <MediaPageHeaderActions
          onAIGenerateClick={handleAIGenerateClick}
          onUploadClick={handleUploadClick}
        />
      </PageHeader>

      {error && (
        <div className="text-center text-destructive bg-destructive/10 border border-destructive/20 p-4">
          <p>{error}</p>
        </div>
      )}

      <Card className="gap-0 shadow-sm border-0">
        <CardHeader className="border-b">
          <MediaPageFilters
            allSelected={allSelected}
            someSelected={someSelected}
            selectedCount={selectedIds.length}
            searchValue={filters.search}
            fileType={filters.file_type}
            mounted={mounted}
            dateRange={filters.date_range || { from: filters.date_from || undefined, to: filters.date_to || undefined }}
            onSelectAll={(checked) => handleSelectAll(!!checked)}
            onSearchChange={debouncedSearch}
            onDeleteSelected={handleDeleteSelected}
            onFileTypeChange={handleFileTypeChange}
            onDateRangeChange={handleDateRangeChange}
          />
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <MediaGridSkeleton />
          ) : (
            <MediaPageGrid
              mediaItems={mediaItems}
              selectedItems={selectedItems}
              onMediaClick={handleMediaClick}
              onSelectItem={handleSelectItem}
            />
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

      <MediaDeleteConfirmDialog
        confirmDialog={confirmDialog}
        onClose={closeConfirmDialog}
      />

      <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader /></div>}>
        <MediaUploadModal
          isOpen={isUploadModalOpen}
          onClose={closeUploadModal}
          onUploadComplete={handleUploadComplete}
          context="media_library"
        />
      </Suspense>

      {canUseAI && (
        <MediaAIGenerateDialog
          isOpen={isAIGenerateModalOpen}
          onOpenChange={setIsAIGenerateModalOpen}
          AIImageGeneratorComponent={AIImageGenerator}
          onImageGenerated={() => {
            fetchMedia(filters);
            closeAIGenerateModal();
          }}
          onSelectGenerated={(media) => {
            handleMediaClick(media);
            closeAIGenerateModal();
          }}
          onNavigateToSettings={() => {
            closeAIGenerateModal();
            navigate('/settings/ai');
          }}
        />
      )}

      <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader /></div>}>
        <MediaDetailsModal
          media={detailMedia}
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          onEdit={handleEditMedia}
          showEditButton={true}
          onMediaUpdated={handleMediaUpdated}
        />
      </Suspense>
    </div>
  );
}