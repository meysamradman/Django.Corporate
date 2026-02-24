import { Tag } from "lucide-react";
import type { Blog } from "@/types/blog/blog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";

interface BlogTagsProps {
    blog: Blog;
}

export function BlogTags({ blog }: BlogTagsProps) {
    const tagsCount = blog.tags?.length || 0;
    const hasTags = tagsCount > 0;

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                    <span>تگ‌ها</span>
                    <Badge variant="blue">{tagsCount.toLocaleString('fa-IR')} مورد</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
            {hasTags ? (
                <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                        <Badge
                            key={tag.id}
                            variant="blue"
                            className="px-3 py-1 text-[10px] font-black h-7 gap-2 border-0 bg-indigo-1/5 text-indigo-1 hover:bg-indigo-1/10"
                        >
                            <Tag className="w-3.5 h-3.5" />
                            {tag.name}
                        </Badge>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="تگی یافت نشد"
                    description="تگی برای این وبلاگ ثبت نشده است"
                    icon={Tag}
                    size="sm"
                    fullBleed={true}
                />
            )}
            </CardContent>
        </Card>
    );
}
