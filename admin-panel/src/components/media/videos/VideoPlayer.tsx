
import { VideoPlayerStandard } from "./VideoPlayerStandard";
import { VideoPlayerHero } from "./VideoPlayerHero";
import { VideoPlayerFeatured } from "./VideoPlayerFeatured";

export interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    size?: string;
    className?: string;
    variant?: "default" | "hero" | "featured";
    heroAspectRatio?: string;
}

export function VideoPlayer({
    src,
    poster,
    title,
    size,
    className,
    variant = "default",
    heroAspectRatio,
}: VideoPlayerProps) {
    if (variant === "hero") {
        return (
            <VideoPlayerHero
                src={src}
                poster={poster}
                title={title}
                size={size}
                className={className}
                heroAspectRatio={heroAspectRatio}
            />
        );
    }

    if (variant === "featured") {
        return (
            <VideoPlayerFeatured
                src={src}
                poster={poster}
                title={title}
                size={size}
                className={className}
            />
        );
    }

    return (
        <VideoPlayerStandard
            src={src}
            poster={poster}
            title={title}
            size={size}
            className={className}
        />
    );
}
