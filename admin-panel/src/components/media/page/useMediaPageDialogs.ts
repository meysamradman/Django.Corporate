import { useState } from 'react';
import type { Media } from '@/types/shared/media';

export interface MediaDeleteConfirmState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function useMediaPageDialogs() {
  const [confirmDialog, setConfirmDialog] = useState<MediaDeleteConfirmState>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [detailMedia, setDetailMedia] = useState<Media | null>(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const openAIGenerateModal = () => setIsAIGenerateModalOpen(true);
  const closeAIGenerateModal = () => setIsAIGenerateModalOpen(false);

  const openDetailModal = (media: Media) => {
    setDetailMedia(media);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => setDetailModalOpen(false);

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  return {
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
  };
}
