import type { Blog } from "@/types/blog/blog";
import { BlogVideo } from "./BlogVideo";
import { BlogAttachments } from "./BlogAttachments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
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
            <Card className="gap-0">
                <CardHeader className="border-b">
                    <CardTitle>رسانه‌ها و مستندات</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                <EmptyState
                    title="رسانه‌ای یافت نشد"
                    description="ویدئو، پادکست یا سندی برای این وبلاگ ثبت نشده است"
                    icon={ImageIcon}
                    size="md"
                    fullBleed={true}
                />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            <BlogVideo blog={blog} />
            <BlogAttachments blog={blog} />
        </div>
    );
}
