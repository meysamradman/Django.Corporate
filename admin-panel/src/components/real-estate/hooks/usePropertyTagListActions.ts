import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyApiError, showSuccess } from "@/core/toast";
import { getStatus, msg } from "@/core/messages";
import { realEstateApi } from "@/api/real-estate";
import type { PropertyTag } from "@/types/real_estate/tags/realEstateTag";
import type { PropertyTagDeleteConfirmState } from "@/types/shared/deleteConfirm";

interface UsePropertyTagListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function usePropertyTagListActions({ setRowSelection }: UsePropertyTagListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<PropertyTagDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => realEstateApi.deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-tags"] });
      showSuccess(msg.crud("deleted", { item: "برچسب ملک" }));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-tag-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (tagIds: number[]) => Promise.all(tagIds.map((id) => realEstateApi.deleteTag(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-tags"] });
      showSuccess(msg.crud("deleted", { item: "برچسب‌های ملک" }));
      setRowSelection({});
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: msg.error("serverError"),
        dedupeKey: "property-tag-bulk-delete-error",
        preferBackendMessage: false,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await realEstateApi.partialUpdateTag(id, { is_active });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["property-tags"] });
      showSuccess(data.is_active ? getStatus("active") : getStatus("inactive"));
    },
    onError: (error) => {
      notifyApiError(error, {
        fallbackMessage: getStatus("statusChangeError"),
        dedupeKey: "property-tag-toggle-active-error",
        preferBackendMessage: false,
      });
    },
  });

  const handleToggleActive = (tag: PropertyTag) => {
    toggleActiveMutation.mutate({
      id: tag.id,
      is_active: !(tag.is_active ?? true),
    });
  };

  const handleDeleteTag = (tagId: number | string) => {
    setDeleteConfirm({
      open: true,
      tagId: Number(tagId),
      isBulk: false,
    });
  };

  const handleDeleteSelected = (selectedIds: (string | number)[]) => {
    setDeleteConfirm({
      open: true,
      tagIds: selectedIds.map((id) => Number(id)),
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk && deleteConfirm.tagIds) {
        await bulkDeleteMutation.mutateAsync(deleteConfirm.tagIds);
      } else if (!deleteConfirm.isBulk && deleteConfirm.tagId) {
        await deleteTagMutation.mutateAsync(deleteConfirm.tagId);
      }
    } catch {
    }

    setDeleteConfirm({ open: false, isBulk: false });
  };

  return {
    deleteConfirm,
    setDeleteConfirm,
    handleDeleteTag,
    handleDeleteSelected,
    handleConfirmDelete,
    handleToggleActive,
  };
}
