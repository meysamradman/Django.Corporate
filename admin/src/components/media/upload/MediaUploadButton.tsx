"use client";

import React, { useState } from "react";
import { Button } from "@/components/elements/Button";
import { MediaUploadModal } from "@/components/media/modals/MediaUploadModal";
import { Upload, Plus } from "lucide-react";
import { Media } from "@/types/shared/media";

interface MediaUploadButtonProps {
    onUploadComplete?: () => void;
    onMediaSelect?: (media: Media | Media[]) => void;
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg";
    children?: React.ReactNode;
    className?: string;
    showIcon?: boolean;
}

export function MediaUploadButton({
    onUploadComplete,
    onMediaSelect,
    variant = "default",
    size = "default",
    children = "آپلود فایل",
    className = "",
    showIcon = true
}: MediaUploadButtonProps) {
    const [showUploadModal, setShowUploadModal] = useState(false);

    const handleUploadComplete = () => {
        if (onUploadComplete) {
            onUploadComplete();
        }
        setShowUploadModal(false);
    };

    const handleClose = () => {
        setShowUploadModal(false);
    };

    return (
        <>
            <Button
                type="button"
                variant={variant}
                size={size}
                onClick={() => setShowUploadModal(true)}
                className={`flex gap-2 ${className}`}
            >
                {showIcon && <Upload className="h-4 w-4" />}
                {children}
            </Button>

            <MediaUploadModal
                isOpen={showUploadModal}
                onClose={handleClose}
                onUploadComplete={handleUploadComplete}
                onMediaSelect={onMediaSelect}
            />
        </>
    );
}

export function QuickMediaUploadButton({
    onUploadComplete,
    onMediaSelect,
    size = "sm",
    className = ""
}: {
    onUploadComplete?: () => void;
    onMediaSelect?: (media: Media | Media[]) => void;
    size?: "default" | "sm" | "lg";
    className?: string;
}) {
    const [showUploadModal, setShowUploadModal] = useState(false);

    const handleUploadComplete = () => {
        if (onUploadComplete) {
            onUploadComplete();
        }
        setShowUploadModal(false);
    };

    const handleClose = () => {
        setShowUploadModal(false);
    };

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size={size}
                onClick={() => setShowUploadModal(true)}
                className={`h-8 w-8 p-0 ${className}`}
            >
                <Plus className="h-4 w-4" />
            </Button>

            <MediaUploadModal
                isOpen={showUploadModal}
                onClose={handleClose}
                onUploadComplete={handleUploadComplete}
                onMediaSelect={onMediaSelect}
            />
        </>
    );
}
