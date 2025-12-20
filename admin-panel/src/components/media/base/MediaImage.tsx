import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { Media } from "@/types/shared/media";
import { mediaService } from "@/components/media/services";
import { cn } from '@/core/utils/cn';
import { Skeleton } from "@/components/elements/Skeleton";

interface MediaImageProps {
    media?: Media | null;
    src?: string;
    alt?: string;
    className?: string;
    width?: number;
    height?: number;
    fill?: boolean;
    sizes?: string;
    style?: CSSProperties;
    showSkeleton?: boolean;
    skeletonClassName?: string;
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
                             style,
                             showSkeleton = true,
                             skeletonClassName,
                         }: MediaImageProps) {
    const [hasError, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const imageUrl = src || (media ? mediaService.getMediaUrlFromObject(media) : '');
    const imageAlt = media ? mediaService.getMediaAltText(media) : (alt || "تصویر");

    const handleLoad = () => {
        if (isMountedRef.current) {
            setLoaded(true);
        }
    };

    const handleError = () => {
        if (isMountedRef.current) {
            setError(true);
        }
    };

    if (!imageUrl && !media) {
        return <div className={cn("bg-bg", className)} style={{width, height, ...style}}/>;
    }

    if (hasError) {
        return (
            <div className={cn("bg-bg flex items-center justify-center", className)} style={{width, height, ...style}}>
                <span className="text-xs text-font-s">خطا در بارگذاری</span>
            </div>
        );
    }

    const imageClasses = cn(
        "transition-opacity duration-300",
        !loaded ? "opacity-0" : "opacity-100",
        className
    );

    const commonProps = {
        src: imageUrl!,
        alt: imageAlt,
        className: imageClasses,
        style,
        sizes,
        onError: handleError,
        onLoad: handleLoad,
    };

    if (fill) {
        return (
            <div className="relative h-full w-full overflow-hidden">
                {showSkeleton && !loaded && (
                    <Skeleton className={cn("absolute inset-0 h-full w-full", skeletonClassName)} />
                )}
                <img {...commonProps} className={cn(commonProps.className, "absolute inset-0 w-full h-full object-cover")} />
            </div>
        );
    }

    return (
        <div
            className="relative inline-block overflow-hidden"
            style={{
                width: width ?? undefined,
                height: height ?? undefined,
            }}
        >
            {showSkeleton && !loaded && (
                <Skeleton className={cn("absolute inset-0 h-full w-full", skeletonClassName)} />
            )}
            <img {...commonProps} width={width || 100} height={height || 100} />
        </div>
    );
} 