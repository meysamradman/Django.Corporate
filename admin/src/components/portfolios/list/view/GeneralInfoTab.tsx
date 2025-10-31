"use client";

import { TabsContent } from "@/components/elements/Tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/elements/Card";
import { Portfolio } from "@/types/portfolio/portfolio";
import { Badge } from "@/components/elements/Badge";
import { FolderOpen, Tag, Globe, Eye, EyeOff } from "lucide-react";

interface GeneralInfoTabProps {
  portfolio: Portfolio;
}

export function GeneralInfoTab({ portfolio }: GeneralInfoTabProps) {
  const renderCategoryPath = (category: any) => {
    if (category?.parent) {
      return `${category.parent.name} > ${category.name}`;
    }
    return category?.name || '';
  };

  return (
    <TabsContent value="general" className="mt-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات پایه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    عنوان
                  </label>
                  <div className="text-base font-semibold">{portfolio.title || '-'}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    لینک (اسلاگ)
                  </label>
                  <div className="text-base">{portfolio.slug || '-'}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    توضیحات کوتاه
                  </label>
                  <div className="text-base text-muted-foreground">
                    {portfolio.short_description || (
                      <span className="text-muted-foreground italic">
                        توضیحی وارد نشده است
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    توضیحات بلند
                  </label>
                  <div
                    className="text-base text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: portfolio.description || "<p class='text-muted-foreground italic'>توضیحی وارد نشده است</p>",
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">تنظیمات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  دسته‌بندی
                </label>
                {portfolio.categories && portfolio.categories.length > 0 ? (
                  <div className="space-y-2">
                    {portfolio.categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="outline"
                        className="w-full justify-start"
                        title={renderCategoryPath(category)}
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    دسته‌بندی‌ای انتخاب نشده است
                  </span>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-500" />
                  تگ‌ها
                </label>
                {portfolio.tags && portfolio.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {portfolio.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    تگی انتخاب نشده است
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">وضعیت انتشار</span>
                  <Badge
                    variant={portfolio.status === "published" ? "green" : "outline"}
                  >
                    {portfolio.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    عمومی
                  </span>
                  {portfolio.is_public ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">عمومی</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <EyeOff className="w-4 h-4" />
                      <span className="text-sm">خصوصی</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ویژه</span>
                  {portfolio.is_featured ? (
                    <Badge variant="green">ویژه</Badge>
                  ) : (
                    <Badge variant="outline">عادی</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">فعال</span>
                  {portfolio.is_active ? (
                    <Badge variant="green">فعال</Badge>
                  ) : (
                    <Badge variant="outline">غیرفعال</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}

