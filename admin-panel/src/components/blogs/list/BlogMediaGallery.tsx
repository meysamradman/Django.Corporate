"use client";

import React from "react";
import { Media } from "@/types/shared/media";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";

interface BlogMediaGalleryProps {
  mediaItems: Media[];
  onMediaSelect: (selectedMedia: Media[]) => void;
  mediaType: "image" | "video" | "audio" | "pdf";
  title: string;
  maxSelection?: number;
  isGallery?: boolean;
  disabled?: boolean;
  contextId?: number | string;
}

export function BlogMediaGallery({
  mediaItems,
  onMediaSelect,
  mediaType,
  title,
  maxSelection,
  isGallery = false,
  disabled = false,
  contextId,
}: BlogMediaGalleryProps) {
  return (
    <MediaGallery
      mediaItems={mediaItems}
      onMediaSelect={onMediaSelect}
      mediaType={mediaType}
      title={title}
      maxSelection={maxSelection}
      isGallery={isGallery}
      disabled={disabled}
      context="blog"
      contextId={contextId}
    />
  );
}
