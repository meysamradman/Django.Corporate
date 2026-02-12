import { useMemo, useState } from 'react';
import type { Media } from '@/types/shared/media';

export function useMediaPageSelection(mediaItems: Media[]) {
  const [selectedItems, setSelectedItems] = useState<Record<string | number, boolean>>({});

  const handleSelectItem = (itemId: number, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedItems({});
      return;
    }

    const nextSelection: Record<string | number, boolean> = {};
    mediaItems.forEach((item) => {
      nextSelection[item.id] = true;
    });
    setSelectedItems(nextSelection);
  };

  const selectedIds = useMemo(() => Object.keys(selectedItems), [selectedItems]);
  const allSelected = mediaItems.length > 0 && selectedIds.length === mediaItems.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const clearSelection = () => setSelectedItems({});

  return {
    selectedItems,
    selectedIds,
    allSelected,
    someSelected,
    setSelectedItems,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
  };
}
