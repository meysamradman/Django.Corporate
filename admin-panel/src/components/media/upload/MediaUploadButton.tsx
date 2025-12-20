import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/elements/Button";
import { MediaUploadModal } from "@/components/media/modals/MediaUploadModal";
import { Upload, Plus } from "lucide-react";
import type { Media } from "@/types/shared/media";
import { useMediaContext } from '../MediaContext';

interface MediaUploadButtonProps {
    onUploadComplete?: () => void;
    onMediaSelect?: (media: Media | Media[]) => void;
    variant?: "default" | "outline";
    size?: "default" | "sm" | "lg";
    children?: ReactNode;
    className?: string;
    showIcon?: boolean;
    context?: 'media_library' | 'portfolio' | 'blog';
    contextId?: number | string;
}

export function MediaUploadButton({
    onUploadComplete,
    onMediaSelect,
    variant = "default",
    size = "default",
    children = "آپلود فایل",
    className = "",
    showIcon = true,
    context: overrideContext,
    contextId: overrideContextId
}: MediaUploadButtonProps) {
    const { context, contextId } = useMediaContext(overrideContext, overrideContextId);
    
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
                context={context}
                contextId={contextId}
            />
        </>
    );
}

export function QuickMediaUploadButton({
    onUploadComplete,
    onMediaSelect,
    size = "sm",
    className = "",
    context: overrideContext,
    contextId: overrideContextId
}: {
    onUploadComplete?: () => void;
    onMediaSelect?: (media: Media | Media[]) => void;
    size?: "default" | "sm" | "lg";
    className?: string;
    context?: 'media_library' | 'portfolio' | 'blog';
    contextId?: number | string;
}) {
    const { context, contextId } = useMediaContext(overrideContext, overrideContextId);
    
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
                variant="outline"
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
                context={context}
                contextId={contextId}
            />
        </>
    );
}
