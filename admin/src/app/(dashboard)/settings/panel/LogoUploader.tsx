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
    statusColor?: string;
    accentGradient?: string;
}

export default function LogoUploader({
    label,
    selectedMedia,
    onMediaSelect,
    showLabel = true,
    size = "md",
    className = "",
    statusColor = "bg-emerald-500",
    accentGradient = "from-primary/30 via-primary/10 to-transparent"
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
        setShowMediaSelector(true);
        setActiveTab("select");
    };

    const handleRemoveImage = () => {
        onMediaSelect(null);
    };

    const sizeClasses: Record<typeof size, string> = {
        sm: "h-24 w-24",
        md: "h-28 w-28",
        lg: "h-32 w-32"
    };

    const buttonSize = {
        sm: "sm",
        md: "sm",
        lg: "default"
    } as const;

    return (
        <div className={`space-y-4 ${className}`}>
            {showLabel && (
                <Label>{label}</Label>
            )}

            <div className="flex flex-col items-center space-y-4">
                <div className="relative shrink-0">
                    <div className={`relative ${sizeClasses[size]} overflow-hidden rounded-2xl`}>
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accentGradient}`} />
                        {selectedMedia ? (
                            <MediaImage
                                media={selectedMedia}
                                alt={label}
                                className="object-cover rounded-2xl"
                                fill
                                sizes={`${size === "sm" ? "96px" : size === "md" ? "112px" : "128px"}`}
                            />
                        ) : (
                            <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-white/60 backdrop-blur-sm">
                                <ImagePlus
                                    className={`${size === "sm" ? "h-10 w-10" : size === "md" ? "h-12 w-12" : "h-14 w-14"} text-primary`}
                                    strokeWidth={1.5}
                                />
                            </div>
                        )}
                    </div>

                    {selectedMedia && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute -top-1 -left-1 h-7 w-7 rounded-full border border-border bg-background p-0 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                            onClick={handleRemoveImage}
                            type="button"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size={buttonSize[size]}
                        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border border-border bg-background p-0 transition-colors hover:bg-muted"
                        onClick={() => setShowMediaSelector(true)}
                        type="button"
                    >
                        <Camera className="h-4 w-4" />
                    </Button>

                    <span className={`absolute -bottom-1 -left-1 h-4 w-4 rounded-full border-2 border-background ${statusColor}`} />
                </div>
            </div>

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

