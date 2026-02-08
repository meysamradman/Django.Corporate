import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { MediaGallery } from "@/components/media/galleries/MediaGallery";
import { Video, Music, FileText } from "lucide-react";
import { MEDIA_MODULES } from "@/components/media/constants";
import type { BlogMedia } from "@/types/blog/blogMedia";

interface BlogMediaOtherProps {
    blogMedia: BlogMedia;
    setBlogMedia: (media: BlogMedia) => void;
    editMode: boolean;
    blogId?: number | string;
    totalMediaCount: number;
}

export function BlogMediaOther({
    blogMedia,
    setBlogMedia,
    editMode,
    blogId,
    totalMediaCount
}: BlogMediaOtherProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CardWithIcon
                    icon={Video}
                    title="ویدیو و تیزر"
                    iconBgColor="bg-purple-0"
                    iconColor="stroke-purple-2"
                    cardBorderColor="border-b-purple-1"
                >
                    <MediaGallery
                        mediaItems={blogMedia?.videoGallery || []}
                        onMediaSelect={(media) => setBlogMedia?.({ ...blogMedia, videoGallery: media })}
                        mediaType="video"
                        title=""
                        isGallery={false}
                        disabled={!editMode}
                        context={MEDIA_MODULES.BLOG}
                        contextId={blogId}
                        totalItemsCount={totalMediaCount}
                    />
                </CardWithIcon>

                <CardWithIcon
                    icon={Music}
                    title="توضیحات صوتی"
                    iconBgColor="bg-pink-0"
                    iconColor="stroke-pink-2"
                    cardBorderColor="border-b-pink-1"
                >
                    <MediaGallery
                        mediaItems={blogMedia?.audioGallery || []}
                        onMediaSelect={(media) => setBlogMedia?.({ ...blogMedia, audioGallery: media })}
                        mediaType="audio"
                        title=""
                        isGallery={false}
                        disabled={!editMode}
                        context={MEDIA_MODULES.BLOG}
                        contextId={blogId}
                        totalItemsCount={totalMediaCount}
                    />
                </CardWithIcon>
            </div>

            <CardWithIcon
                icon={FileText}
                title="مستندات و فایل‌های ضمیمه (PDF)"
                iconBgColor="bg-orange-0"
                iconColor="stroke-orange-2"
                cardBorderColor="border-b-orange-1"
            >
                <MediaGallery
                    mediaItems={blogMedia?.pdfDocuments || []}
                    onMediaSelect={(media) => setBlogMedia?.({ ...blogMedia, pdfDocuments: media })}
                    mediaType="document"
                    title=""
                    isGallery={false}
                    disabled={!editMode}
                    context={MEDIA_MODULES.BLOG}
                    contextId={blogId}
                    totalItemsCount={totalMediaCount}
                />
            </CardWithIcon>
        </div>
    );
}
