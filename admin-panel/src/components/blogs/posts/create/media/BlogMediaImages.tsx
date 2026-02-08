import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Image as ImageIcon } from "lucide-react";
import { MEDIA_MODULES } from "@/components/media/constants";
import type { BlogMedia } from "@/types/blog/blogMedia";

interface BlogMediaImagesProps {
    blogMedia: BlogMedia;
    setBlogMedia: (media: BlogMedia) => void;
    editMode: boolean;
    blogId?: number | string;
    totalMediaCount: number;
}

export function BlogMediaImages({
    blogMedia,
    setBlogMedia,
    editMode,
    blogId,
    totalMediaCount
}: BlogMediaImagesProps) {
    return (
        <CardWithIcon
            icon={ImageIcon}
            title="گالری تصاویر"
            iconBgColor="bg-blue-0"
            iconColor="stroke-blue-2"
            cardBorderColor="border-b-blue-1"
        >
            <MediaGallery
                mediaItems={blogMedia?.imageGallery || []}
                onMediaSelect={(media) => setBlogMedia?.({ ...blogMedia, imageGallery: media })}
                mediaType="image"
                title=""
                isGallery={true}
                disabled={!editMode}
                context={MEDIA_MODULES.BLOG}
                contextId={blogId}
                totalItemsCount={totalMediaCount}
            />
        </CardWithIcon>
    );
}
