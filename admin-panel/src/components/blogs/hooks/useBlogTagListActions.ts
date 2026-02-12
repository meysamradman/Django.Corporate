import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "@/api/blogs/blogs";
import { showError, showSuccess } from "@/core/toast";
import { msg } from "@/core/messages";
import type { BlogTagDeleteConfirmState } from "@/types/shared/deleteConfirm";


interface UseBlogTagListActionsParams {
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
}

export function useBlogTagListActions({ setRowSelection }: UseBlogTagListActionsParams) {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<BlogTagDeleteConfirmState>({
    open: false,
    isBulk: false,
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => {
      return blogApi.deleteTag(tagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
      showSuccess(msg.crud("deleted", { item: "تگ" }));
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (tagIds: number[]) => {
      return blogApi.bulkDeleteTags(tagIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showSuccess(msg.crud("deleted", { item: "تگ" }));
      setRowSelection({});
    },
    onError: () => {
      showError("خطای سرور");
    },
  });

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
  };
}
