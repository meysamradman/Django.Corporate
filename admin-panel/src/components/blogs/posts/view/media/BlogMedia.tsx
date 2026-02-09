import type { Blog } from "@/types/blog/blog";
import { BlogVideo } from "./BlogVideo";
import { BlogAttachments } from "./BlogAttachments";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface BlogMediaProps {
    blog: Blog;
}

export function BlogMedia({ blog }: BlogMediaProps) {
    const allMedia = blog.blog_media || [];
    const hasMedia = allMedia.some((item: any) => {
        const media = item.media_detail || item.media;
        return ['video', 'audio', 'document', 'pdf'].includes(media?.media_type);
    });

    if (!hasMedia) {
        return (
            <CardWithIcon
                icon={ImageIcon}
                title="رسانه‌ها و مستندات"
                iconBgColor="bg-pink"
                iconColor="stroke-pink-2"
                cardBorderColor="border-b-pink-1"
                contentClassName="p-0"
            >
                <EmptyState
                    title="رسانه‌ای یافت نشد"
                    description="ویدئو، پادکست یا سندی برای این وبلاگ ثبت نشده است"
                    icon={ImageIcon}
                    size="md"
                    fullBleed={true}
                />
            </CardWithIcon>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            <BlogVideo blog={blog} />
            <BlogAttachments blog={blog} />
        </div>
    );
}
