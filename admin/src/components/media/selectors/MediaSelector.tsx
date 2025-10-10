"use client";

import React, { useState } from "react";
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { MediaThumbnail } from "@/components/media/base/MediaThumbnail";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Media } from "@/types/shared/media";
import { ImagePlus, X } from "lucide-react";

interface MediaSelectorProps {
    selectedMedia: Media | null;
    onMediaSelect: (media: Media | null) => void;
    label?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    className?: string;
}

export function MediaSelector({
    selectedMedia,
    onMediaSelect,
    label = "انتخاب تصویر",
    size = "md",
    showLabel = true,
    className = ""
}: MediaSelectorProps) {
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
        // بعد از آپلود، مودال انتخاب را باز کن
        setShowMediaSelector(true);
        setActiveTab("select");
    };

    const handleRemoveImage = () => {
        onMediaSelect(null);
    };

    const sizeClasses = {
        sm: "w-20 h-20",
        md: "w-32 h-32",
        lg: "w-40 h-40"
    };

    const buttonSize = {
        sm: "sm",
        md: "sm",
        lg: "default"
    } as const;

    const iconSize = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5"
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {showLabel && (
                <Label>{label}</Label>
            )}
            
            <div className="flex items-center gap-4">
                <div className={`relative ${sizeClasses[size]} border rounded-lg overflow-hidden`}>
                    {selectedMedia ? (
                        <MediaThumbnail
                            media={selectedMedia}
                            alt="تصویر پروفایل"
                            className="object-cover"
                            fill
                            sizes={`${size === "sm" ? "80px" : size === "md" ? "128px" : "160px"}`}
                            showIcon={true}
                        />
                    ) : (
                        <div className={`w-full h-full bg-muted flex items-center justify-center rounded-lg`}>
                            <span className={`font-medium ${size === "sm" ? "text-sm" : size === "md" ? "text-lg" : "text-xl"}`}>
                                IMG
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="space-y-2">
                    <Button 
                        type="button" 
                        variant="outline" 
                        size={buttonSize[size]}
                        onClick={() => setShowMediaSelector(true)}
                        className="flex gap-2"
                    >
                        <ImagePlus className={iconSize[size]} />
                        مدیریت تصویر
                    </Button>
                    
                    {selectedMedia && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size={buttonSize[size]}
                            onClick={handleRemoveImage}
                            className="text-destructive hover:text-destructive"
                        >
                            <X className={iconSize[size]} />
                            حذف تصویر
                        </Button>
                    )}
                </div>
            </div>

            {/* Media Library Modal with Tabs */}
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
