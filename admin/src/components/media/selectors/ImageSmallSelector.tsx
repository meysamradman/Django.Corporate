"use client";

import React, { useState } from "react";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { MediaThumbnail } from "@/components/media/base/MediaThumbnail";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Media } from "@/types/shared/media";
import { Camera, X } from "lucide-react";

interface ImageSmallSelectorProps {
    selectedMedia: Media | null;
    onMediaSelect: (media: Media | null) => void;
    label?: string;
    name?: string;
    disabled?: boolean;
    className?: string;
}

export function ImageSmallSelector({
    selectedMedia,
    onMediaSelect,
    label = "تصویر",
    name = "",
    disabled = false,
    className = ""
}: ImageSmallSelectorProps) {
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

    const handleRemoveImage = () => {
        onMediaSelect(null);
    };

    const handleUploadComplete = () => {
        setShowMediaSelector(true);
        setActiveTab("select");
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <Label>{label}</Label>
            )}
            
            <div className="relative w-32 h-32">
                {selectedMedia ? (
                    <div className="w-full h-full rounded-xl overflow-hidden border-4 border-card relative">
                        <MediaThumbnail
                            media={selectedMedia}
                            alt={label}
                            className="object-cover"
                            fill
                            sizes="128px"
                            showIcon={true}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-card">
                        {name?.[0]?.toUpperCase() || "IMG"}
                    </div>
                )}
                
                {/* دکمه تغییر تصویر */}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute -bottom-1 -right-1 h-7 w-7 p-0 rounded-full bg-background border-2 border-border hover:bg-muted transition-colors"
                    onClick={() => setShowMediaSelector(true)}
                    disabled={disabled}
                >
                    <Camera className="h-3 w-3" />
                </Button>
                
                {/* دکمه حذف تصویر */}
                {selectedMedia && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute -top-1 -left-1 h-7 w-7 p-0 rounded-full bg-destructive border-2 border-destructive hover:bg-destructive/90 transition-colors"
                        onClick={handleRemoveImage}
                        disabled={disabled}
                    >
                        <X className="h-3 w-3 text-white" />
                    </Button>
                )}
            </div>

            {/* Media Library Modal */}
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
            />
        </div>
    );
}

