
import { FolderOpen } from "lucide-react";
import type { Portfolio } from "@/types/portfolio/portfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { EmptyState } from "@/components/shared/EmptyState";

interface PortfolioCategoriesProps {
    portfolio: Portfolio;
}

export function PortfolioCategories({ portfolio }: PortfolioCategoriesProps) {
    const categoriesCount = portfolio.categories?.length || 0;
    const hasCategories = categoriesCount > 0;

    return (
        <Card className="gap-0 shadow-sm">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-between">
                    <span>دسته‌بندی‌ها</span>
                    <Badge variant="purple" className="h-5 px-2 text-[10px] font-black bg-purple-1/10 text-purple-1 border-purple-1/20">{categoriesCount.toLocaleString('fa-IR')} مورد</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
            {hasCategories ? (
                <div className="flex flex-wrap gap-2 px-5 py-2">
                    {portfolio.categories.map((category) => (
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
                    description="دسته‌بندی‌ای برای این نمونه‌کار انتخاب نشده است"
                    icon={FolderOpen}
                    size="sm"
                    fullBleed={true}
                />
            )}
            </CardContent>
        </Card>
    );
}
