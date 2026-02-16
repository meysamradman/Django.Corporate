import { useState } from "react";
import { Label } from "@/components/elements/Label";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import type { Media } from "@/types/shared/media";
import { useMediaContext } from '../MediaContext';
import { type MediaContextType } from "../constants";
import { ImageSelectorPreview } from './ImageSelectorPreview';

interface ImageSelectorProps {
    selectedMedia: Media | null;
    onMediaSelect: (media: Media | null) => void;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
    showRemoveButton?: boolean;
    showChangeButton?: boolean;
    context?: MediaContextType;
    contextId?: number | string;
    placeholderText?: string;
    alt?: string;
    label?: string;
    name?: string;
    placeholderColor?: "primary" | "purple";
}

const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
};

const iconSizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
};

export function ImageSelector({
    selectedMedia,
    onMediaSelect,
    loading = false,
    disabled = false,
    className = "",
    size = "lg",
    showRemoveButton = true,
    showChangeButton = true,
    context: overrideContext,
    contextId: overrideContextId,
    placeholderText,
    alt = "تصویر",
    label,
    name,
    placeholderColor = "primary",
}: ImageSelectorProps) {
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
        setActiveTab("select");
    };

    const sizeClass = sizeClasses[size];
    const iconSize = iconSizes[size];

    const placeholderBgClass = placeholderColor === "purple"
        ? "bg-gradient-to-br from-purple-1 to-purple-2"
        : "bg-gradient-to-br from-primary/80 to-primary";

    const handleRemove = () => {
        if (!disabled && onMediaSelect) {
            onMediaSelect(null);
        }
    };

    const imageContent = (
        <div className="relative shrink-0 group">
            <ImageSelectorPreview
                selectedMedia={selectedMedia}
                loading={loading}
                disabled={disabled}
                sizeClass={sizeClass}
                iconSize={iconSize}
                size={size}
                showRemoveButton={showRemoveButton}
                showChangeButton={showChangeButton}
                placeholderText={placeholderText}
                placeholderBgClass={placeholderBgClass}
                name={name}
                alt={alt}
                onRemove={handleRemove}
                onOpenSelector={() => setShowMediaSelector(true)}
            />

            <MediaLibraryModal
                isOpen={showMediaSelector}
                onClose={() => setShowMediaSelector(false)}
                onSelect={handleMediaSelect}
                selectMultiple={false}
                initialFileType="image"
                showTabs={true}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onUploadComplete={handleUploadComplete}
                context={context}
                contextId={contextId}
            />
        </div>
    );

    if (label !== undefined) {
        return (
            <div className={`space-y-2 ${className}`}>
                {label && <Label>{label}</Label>}
                {imageContent}
            </div>
        );
    }

    return <div className={className}>{imageContent}</div>;
}

