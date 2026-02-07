import { Tag } from "lucide-react";
import type { Blog } from "@/types/blog/blog";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";

interface BlogTagsProps {
    blog: Blog;
}

export function BlogTags({ blog }: BlogTagsProps) {
    const tagsCount = blog.tags?.length || 0;
    const hasTags = tagsCount > 0;

    return (
        <CardWithIcon
            icon={Tag}
            id="section-tags"
            title="تگ‌ها"
            iconBgColor="bg-indigo-0/50"
            iconColor="text-indigo-1"
            cardBorderColor="border-b-indigo-1"
            className="shadow-sm"
            titleExtra={<Badge variant="blue" className="h-5 px-2 text-[10px] font-black bg-indigo-1/10 text-indigo-1 border-indigo-1/20">{tagsCount.toLocaleString('fa-IR')} مورد</Badge>}
        >
            {hasTags ? (
                <div className="flex flex-wrap gap-2 px-5 py-2">
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
        </CardWithIcon>
    );
}
