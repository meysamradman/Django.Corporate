import { useState } from "react";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import type { Media } from "@/types/shared/media";
import { Camera, X, User } from "lucide-react";
import { useMediaContext } from '../MediaContext';
import { type MediaContextType } from "../constants";

interface ImageSelectorProps {
    selectedMedia: Media | null;
    onMediaSelect: (media: Media | null) => void;
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

    const getPlaceholderContent = () => {
        if (placeholderText) {
            return <span className="text-2xl">{placeholderText}</span>;
        }
        if (name) {
            return <span className="text-4xl font-bold">{name[0]?.toUpperCase() || "IMG"}</span>;
        }
        return <User className={iconSize} strokeWidth={1.5} />;
    };

    const imageContent = (
        <div className="relative shrink-0 group">
            {selectedMedia ? (
                <>
                    <div className={`${sizeClass} rounded-xl overflow-hidden border-4 border-card relative`}>
                        <MediaImage
                            media={selectedMedia}
                            alt={alt}
                            className="object-cover"
                            fill
                            sizes={size === "lg" ? "256px" : size === "md" ? "192px" : "128px"}
                        />
                    </div>
                    {showRemoveButton && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute h-8 w-8 p-0 rounded-full bg-card border-2 hover:bg-bg transition-colors shadow-lg pointer-events-auto flex items-center justify-center"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!disabled && onMediaSelect) {
                                    onMediaSelect(null);
                                }
                            }}
                            disabled={disabled}
                            aria-label="حذف عکس"
                            style={{
                                top: '-10px',
                                left: '-10px',
                                zIndex: 9999
                            }}
                        >
                            <X className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </>
            ) : (
                <div className={`${sizeClass} rounded-xl ${placeholderBgClass} flex items-center justify-center text-static-w border-4 border-card`}>
                    {getPlaceholderContent()}
                </div>
            )}

            {showChangeButton && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-8 w-8 p-0 rounded-full bg-card border-2 hover:bg-bg transition-colors flex items-center justify-center"
                    onClick={() => setShowMediaSelector(true)}
                    disabled={disabled}
                    aria-label="تغییر عکس"
                >
                    <Camera className="h-4 w-4" />
                </Button>
            )}

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

