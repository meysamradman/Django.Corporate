import { useState, useEffect, useCallback, useMemo, type ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/elements/Dialog";
import { mediaApi, DEFAULT_MEDIA_PAGE_SIZE } from '@/api/media/media';
import type { Media, MediaFilter } from '@/types/shared/media';
import { useMediaUpload } from '@/components/media/hooks/useMediaUpload';
import { showError } from "@/core/toast";
import { msg } from '@/core/messages';
import { useUserPermissions } from '@/core/permissions/hooks/useUserPermissions';
import { useHasAccess } from '@/core/permissions/hooks/useHasAccess';
import { mediaService } from '@/components/media/services';
import { MediaDetailsModal } from '@/components/media/modals/MediaDetailsModal';
import { useDebounceValue } from '@/core/hooks/useDebounce';
import { useMediaContext } from '../MediaContext';
import { MediaLibraryUploadTab } from '@/components/media/modals/library/MediaLibraryUploadTab';
import { MediaLibrarySelectTab } from '@/components/media/modals/library/MediaLibrarySelectTab';
import { MediaLibraryHeaderTabs } from '@/components/media/modals/library/MediaLibraryHeaderTabs';

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
      showError(msg.action('coverMustBeImage'));
      return;
    }

    if (!uploadSettings?.sizeLimit?.image || selectedCoverFile.size > uploadSettings.sizeLimit.image) {
      const maxSize = uploadSettings?.sizeLimitFormatted?.image || 'نامشخص';
      showError(msg.validation('fileSizeLimit', { max: maxSize }));
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

  const dialogContent = (
    <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0" showCloseButton={false}>
      <MediaLibraryHeaderTabs
        showTabs={showTabs}
        currentActiveTab={currentActiveTab}
        canUploadMedia={canUploadMedia}
        onTabChange={handleTabChange}
      />

      {currentActiveTab === "upload" ? (
        <MediaLibraryUploadTab
          isLoadingSettings={isLoadingSettings}
          canUploadMedia={canUploadMedia}
          isUploading={isUploading}
          uploadSettings={uploadSettings}
          validationErrors={validationErrors}
          files={files}
          uploadProgress={uploadProgress}
          processFiles={processFiles}
          removeFile={removeFile}
          updateFileMetadata={updateFileMetadata}
          removeCoverFile={removeCoverFile}
          onCoverFileChange={handleCoverFileChange}
          onTabChange={handleTabChange}
          onUpload={handleUpload}
        />
      ) : (
        <MediaLibrarySelectTab
          searchTerm={searchTerm}
          filters={filters}
          error={error}
          isLoading={isLoading}
          mediaItems={mediaItems}
          selectedMedia={selectedMedia}
          selectedIds={selectedIds}
          totalCount={totalCount}
          onSearchTermChange={setSearchTerm}
          onFileTypeChange={handleFileTypeChange}
          onSelectMedia={handleSelectMedia}
          onPageChange={handlePageChange}
          onPageSizeChange={(newLimit) => {
            setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
          }}
          onCancel={() => { setSelectedMedia({}); onClose(); }}
          onConfirmSelection={handleConfirmSelection}
        />
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