"use client";

import { TabsContent } from "@/components/elements/Tabs";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
import { Portfolio } from "@/types/portfolio/portfolio";
import { Badge } from "@/components/elements/Badge";
import { FolderOpen, Tag, Globe, Eye, EyeOff, FileText } from "lucide-react";

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
          <CardWithIcon
            icon={FileText}
            title="اطلاعات پایه"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            contentClassName="space-y-6"
          >
              <div className="space-y-4">
                <div>
                  <label className="text-font-s mb-2 block">
                    عنوان
                  </label>
                  <div>{portfolio.title || '-'}</div>
                </div>

                <div>
                  <label className="text-font-s mb-2 block">
                    لینک (اسلاگ)
                  </label>
                  <div>{portfolio.slug || '-'}</div>
                </div>

                <div>
                  <label className="text-font-s mb-2 block">
                    توضیحات کوتاه
                  </label>
                  <div className="text-font-s">
                    {portfolio.short_description || (
                      <span className="text-font-s">
                        توضیحی وارد نشده است
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-font-s mb-2 block">
                    توضیحات بلند
                  </label>
                  <div
                    className="text-font-s prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: portfolio.description || "<p class='text-font-s'>توضیحی وارد نشده است</p>",
                    }}
                  />
                </div>
              </div>
          </CardWithIcon>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <CardWithIcon
            icon={FolderOpen}
            title="تنظیمات"
            iconBgColor="bg-blue"
            iconColor="stroke-blue-2"
            borderColor="border-b-blue-1"
            contentClassName="space-y-6"
          >
              <div>
                <label className="text-font-s mb-3 block flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 stroke-blue-1" />
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
                  <span className="text-font-s">
                    دسته‌بندی‌ای انتخاب نشده است
                  </span>
                )}
              </div>

              <div>
                <label className="text-font-s mb-3 block flex items-center gap-2">
                  <Tag className="w-4 h-4 stroke-green-1" />
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
                  <span className="text-font-s">
                    تگی انتخاب نشده است
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span>وضعیت انتشار</span>
                  <Badge
                    variant={portfolio.status === "published" ? "green" : "outline"}
                  >
                    {portfolio.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    عمومی
                  </span>
                  {portfolio.is_public ? (
                    <div className="flex items-center gap-2 text-green-2">
                      <Eye className="w-4 h-4" />
                      <span>عمومی</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-font-s">
                      <EyeOff className="w-4 h-4" />
                      <span>خصوصی</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>ویژه</span>
                  {portfolio.is_featured ? (
                    <Badge variant="orange">ویژه</Badge>
                  ) : (
                    <Badge variant="gray">عادی</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span>فعال</span>
                  {portfolio.is_active ? (
                    <Badge variant="blue">فعال</Badge>
                  ) : (
                    <Badge variant="red">غیرفعال</Badge>
                  )}
                </div>
              </div>
          </CardWithIcon>
        </div>
      </div>
    </TabsContent>
  );
}

