import { useState } from "react";
import { Label } from "@/components/elements/Label";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import type { Media } from "@/types/shared/media";
import { useMediaContext } from '../MediaContext';
import { MediaSelectorPreview } from './MediaSelectorPreview';

interface MediaSelectorProps {
    selectedMedia: Media | null;
    onMediaSelect: (media: Media | null) => void;
    label?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    className?: string;
    context?: 'media_library' | 'portfolio' | 'blog';
    contextId?: number | string;
    initialFileType?: "image" | "video" | "audio" | "pdf" | "all";
}

export function MediaSelector({
    selectedMedia,
    onMediaSelect,
    label = "انتخاب تصویر",
    size = "md",
    showLabel = true,
    className = "",
    context: overrideContext,
    contextId: overrideContextId,
    initialFileType = "image"
}: MediaSelectorProps) {
    const { context, contextId } = useMediaContext(overrideContext, overrideContextId);

    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [activeTab, setActiveTab] = useState<"select" | "upload">("select");

    const handleMediaSelect = (selectedMedia: Media | Media[]) => {
        if (Array.isArray(selectedMedia)) {
            onMediaSelect(selectedMedia[0] || null);
        } else {
            onMediaSelect(selectedMedia);
        }
        setShowMediaSelector(false);
    };

    const handleUploadComplete = () => {
        setShowMediaSelector(true);
        setActiveTab("select");
    };

    const handleRemoveImage = () => {
        onMediaSelect(null);
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {showLabel && (
                <Label>{label}</Label>
            )}

            <MediaSelectorPreview
                selectedMedia={selectedMedia}
                size={size}
                onOpenSelector={() => setShowMediaSelector(true)}
                onRemove={handleRemoveImage}
            />

            <MediaLibraryModal
                isOpen={showMediaSelector}
                onClose={() => setShowMediaSelector(false)}
                onSelect={handleMediaSelect}
                selectMultiple={false}
                initialFileType={initialFileType}
                showTabs={true}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onUploadComplete={handleUploadComplete}
                context={context}
                contextId={contextId}
            />
        </div>
    );
}
