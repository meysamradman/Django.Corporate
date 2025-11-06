'use client';

import React, { useState } from 'react';
import { Button } from "@/components/elements/Button";
import { Label } from "@/components/elements/Label";
import { MediaImage } from "@/components/media/base/MediaImage";
import { MediaLibraryModal } from "@/components/media/modals/MediaLibraryModal";
import { Media } from "@/types/shared/media";
import { ImagePlus, X, Camera } from "lucide-react";

interface LogoUploaderProps {
    label: string;
    selectedMedia: Media | null;
    onMediaSelect: (media: Media | null) => void;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export default function LogoUploader({ 
    label,
    selectedMedia,
    onMediaSelect,
    showLabel = true,
    size = "md",
    className = ""
}: LogoUploaderProps) {
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
        <div className={`space-y-4 ${className}`}>
            {showLabel && (
                <Label>{label}</Label>
            )}
            
            <div className="flex flex-col items-center space-y-4">
                <div className="relative shrink-0 group">
                    <div className={`relative ${sizeClasses[size]} border-4 border-card rounded-xl overflow-hidden`}>
                        {selectedMedia ? (
                            <MediaImage
                                media={selectedMedia}
                                alt={label}
                                className="object-cover"
                                fill
                                sizes={`${size === "sm" ? "80px" : size === "md" ? "128px" : "160px"}`}
                            />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground ${size === "sm" ? "text-2xl" : size === "md" ? "text-4xl" : "text-5xl"} font-bold`}>
                                <ImagePlus className={size === "sm" ? "w-8 h-8" : size === "md" ? "w-16 h-16" : "w-20 h-20"} strokeWidth={1.5} />
                            </div>
                        )}
                    </div>
                    
                    {selectedMedia && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute -top-1 -left-1 h-7 w-7 p-0 rounded-full bg-background border-2 border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={handleRemoveImage}
                            type="button"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                    
                    <Button
                        variant="outline"
                        size="sm"
                        className="absolute -bottom-1 -right-1 h-7 w-7 p-0 rounded-full bg-background border-2 border-border hover:bg-muted transition-colors"
                        onClick={() => setShowMediaSelector(true)}
                        type="button"
                    >
                        <Camera className="h-3 w-3" />
                    </Button>
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