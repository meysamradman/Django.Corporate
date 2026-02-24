import { FolderOpen } from "lucide-react";
import type { Blog } from "@/types/blog/blog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";

interface BlogCategoriesProps {
    blog: Blog;
}

export function BlogCategories({ blog }: BlogCategoriesProps) {
    const categoriesCount = blog.categories?.length || 0;
    const hasCategories = categoriesCount > 0;

    return (
        <Card className="gap-0">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                    <span>دسته‌بندی‌ها</span>
                    <Badge variant="purple">{categoriesCount.toLocaleString('fa-IR')} مورد</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
            {hasCategories ? (
                <div className="flex flex-wrap gap-2">
                    {blog.categories.map((category) => (
                        <Badge
                            key={category.id}
                            variant="purple"
                            className="px-3 py-1 text-[10px] font-black h-7 gap-2 border-0 bg-purple-1/5 text-purple-1 hover:bg-purple-1/10"
                        >
                            <FolderOpen className="w-3.5 h-3.5" />
                            {category.name}
                        </Badge>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="دسته‌بندی‌ای یافت نشد"
                    description="دسته‌بندی‌ای برای این وبلاگ انتخاب نشده است"
                    icon={FolderOpen}
                    size="sm"
                    fullBleed={true}
                />
            )}
            </CardContent>
        </Card>
    );
}
