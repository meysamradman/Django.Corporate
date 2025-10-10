"use client";

import Image from "next/image";
import { useState } from "react";
import { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
import { cn } from '@/core/utils/cn';

interface MediaImageProps {
    media?: Media | null;
    src?: string;
    alt?: string;
    className?: string;
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
    quality?: number;
    unoptimized?: boolean;
    style?: React.CSSProperties;
}

export function MediaImage({
                             media,
                             src,
                             alt,
                             className,
                             width,
                             height,
                             fill = false,
                             sizes,
                             priority = false,
                             quality = 75,
                             unoptimized = false,
                             style,
                         }: MediaImageProps) {
    const [hasError, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    
    // Debug logging removed for production
    
    // First try direct src, then media object
    const imageUrl = src || (media ? mediaService.getMediaUrlFromObject(media) : '');
    const imageAlt = media ? mediaService.getMediaAltText(media) : (alt || "تصویر");
    
    if (!imageUrl && !media) {
        return <div className={cn("bg-muted", className)} style={{width, height, ...style}}/>;
    }
    
    if (hasError) {
        return <div className={cn("bg-muted flex items-center justify-center", className)} style={{width, height, ...style}}>
            <span className="text-xs text-muted-foreground">خطا در بارگذاری</span>
        </div>;
    }
    const imageClasses = cn(
        "transition-opacity duration-300",
        !loaded ? "opacity-0" : "opacity-100",
        className
    );
    if (fill) {
        return (
            <Image
                src={imageUrl!}
                alt={imageAlt}
                className={imageClasses}
                fill={true}
                sizes={sizes || "100vw"}
                priority={priority}
                quality={quality}
                unoptimized={unoptimized}
                style={style}
                onError={() => setError(true)}
                onLoad={() => setLoaded(true)}
            />
        );
    }
    return (
        <Image
            src={imageUrl!}
            alt={imageAlt}
            className={imageClasses}
            width={width || 100}
            height={height || 100}
            sizes={sizes}
            priority={priority}
            quality={quality}
            unoptimized={unoptimized}
            style={style}
            onError={() => setError(true)}
            onLoad={() => setLoaded(true)}
        />
    );
} 