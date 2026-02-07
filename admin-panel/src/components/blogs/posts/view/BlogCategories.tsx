import { FolderOpen } from "lucide-react";
import type { Blog } from "@/types/blog/blog";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";

interface BlogCategoriesProps {
    blog: Blog;
}

export function BlogCategories({ blog }: BlogCategoriesProps) {
    const categoriesCount = blog.categories?.length || 0;
    const hasCategories = categoriesCount > 0;

    const renderCategoryPath = (category: any) => {
        if (category?.parent) {
            return `${category.parent.name} > ${category.name}`;
        }
        return category?.name || "";
    };

    return (
        <CardWithIcon
            icon={FolderOpen}
            id="section-categories"
            title="دسته‌بندی‌ها"
            iconBgColor="bg-purple-0/50"
            iconColor="text-purple-1"
            cardBorderColor="border-b-purple-1"
            className="shadow-sm"
            titleExtra={<Badge variant="purple" className="h-5 px-2 text-[10px] font-black bg-purple-1/10 text-purple-1 border-purple-1/20">{categoriesCount.toLocaleString('fa-IR')} مورد</Badge>}
        >
            {hasCategories ? (
                <div className="flex flex-wrap gap-2 px-5 py-2">
                    {blog.categories.map((category) => (
                        <Badge
                            key={category.id}
                            variant="purple"
                            className="px-3 py-1 text-[10px] font-black h-7 gap-2 border-0 bg-purple-1/5 text-purple-1 hover:bg-purple-1/10"
                            title={renderCategoryPath(category)}
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
        </CardWithIcon>
    );
}
