'use client';

import React, { useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/elements/Button";
import { mediaService } from '@/components/media/services';
import { env } from '@/core/config/environment';

interface LogoUploaderProps {
    label: string;
    currentImageUrl?: string | null;
    onFileSelect: (file: File | null) => void; // Callback to pass file to parent
    onFileDelete?: () => void; // Callback when delete button is clicked
    isDeleted?: boolean; // External deleted state from parent
    fieldId: string;
}

export default function LogoUploader({ 
    label, 
    currentImageUrl, 
    onFileSelect, 
    onFileDelete,
    isDeleted = false,
    fieldId 
}: LogoUploaderProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Reset preview when currentImageUrl changes
    useEffect(() => {
        if (previewUrl) {
            setPreviewUrl(null);
        }
    }, [currentImageUrl]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;

        if (file) {
            // Validate file using secure config (extension + MIME type)
            const validation = mediaService.validateFileAdvanced(file);
            if (!validation.isValid) {
                alert(validation.errors.join(', '));
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }

        onFileSelect(file); // Pass file up to the form
    };

    const handleUploadClick = () => {
        const input = document.getElementById(fieldId) as HTMLInputElement;
        input?.click();
    };

    const handleReset = () => {
        setPreviewUrl(null);
        onFileSelect(null);
        const input = document.getElementById(fieldId) as HTMLInputElement;
        if (input) input.value = '';
        
        // Call parent's delete handler if provided
        if (onFileDelete) {
            onFileDelete();
        }
    };

    // Use parent's deleted state or show current/preview image
    const displayUrl = previewUrl || (isDeleted ? null : currentImageUrl);

    return (
        <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
                {displayUrl ? (
                    <Image 
                        key={displayUrl} 
                        src={displayUrl} 
                        alt={label} 
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="space-y-2">
                <div className="flex gap-4">
                    <Button
                        type="button"
                        onClick={handleUploadClick}
                    >
                        آپلود تصویر جدید
                    </Button>
                    {displayUrl && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleReset}
                        >
                            حذف
                        </Button>
                    )}
                </div>

            </div>
            <input
                id={fieldId}
                type="file"
                accept={mediaService.getImageAcceptTypes()}
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
} 