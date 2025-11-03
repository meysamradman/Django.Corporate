"use client";

import { TabsContent } from "@/components/elements/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { Portfolio } from "@/types/portfolio/portfolio";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import {
  FolderOpen,
  Tag,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  FileCode,
} from "lucide-react";

interface OverviewTabProps {
  portfolio: Portfolio;
}

export function OverviewTab({ portfolio }: OverviewTabProps) {
  const allMedia = portfolio.portfolio_media || [];
  const imagesCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "image"
  ).length;
  const videosCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "video"
  ).length;
  const audiosCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "audio"
  ).length;
  const documentsCount = allMedia.filter(
    (item: any) => (item.media_detail || item.media)?.media_type === "document"
  ).length;

  const categoriesCount = portfolio.categories?.length || 0;
  const tagsCount = portfolio.tags?.length || 0;
  const optionsCount = portfolio.options?.length || 0;

  const renderCategoryPath = (category: any) => {
    if (category?.parent) {
      return `${category.parent.name} > ${category.name}`;
    }
    return category?.name || "";
  };

  return (
    <TabsContent value="overview" className="mt-0 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-teal-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 rounded-xl shadow-sm">
                  <FolderOpen className="w-5 h-5 stroke-teal-600" />
                </div>
                <CardTitle>دسته‌بندی‌ها</CardTitle>
              </div>
              <Badge variant="teal">
                {categoriesCount} مورد
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              دسته‌بندی‌های مرتبط با این نمونه کار
            </p>
            {portfolio.categories && portfolio.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {portfolio.categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="cursor-default"
                    title={renderCategoryPath(category)}
                  >
                    <FolderOpen className="w-3 h-3 me-1" />
                    {category.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                دسته‌بندی‌ای انتخاب نشده است
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-fuchsia-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-fuchsia-100 rounded-xl shadow-sm">
                  <Tag className="w-5 h-5 stroke-fuchsia-600" />
                </div>
                <CardTitle>تگ‌ها</CardTitle>
              </div>
              <Badge variant="fuchsia">
                {tagsCount} مورد
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              برچسب‌های مرتبط با این نمونه کار
            </p>
            {portfolio.tags && portfolio.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {portfolio.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="cursor-default"
                  >
                    <Tag className="w-3 h-3 me-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                تگی انتخاب نشده است
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                  <ImageIcon className="w-5 h-5 stroke-indigo-600" />
                </div>
                <CardTitle>مدیا</CardTitle>
              </div>
              <Badge variant="indigo">
                {portfolio.media_count || 0} مورد
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              تعداد کل رسانه‌های آپلود شده
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-cyan-50 rounded">
                <ImageIcon className="w-4 h-4 stroke-cyan-600" />
                <span>{imagesCount} تصویر</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                <Video className="w-4 h-4 stroke-purple-600" />
                <span>{videosCount} ویدیو</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-rose-50 rounded">
                <Music className="w-4 h-4 stroke-rose-600" />
                <span>{audiosCount} صدا</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <FileText className="w-4 h-4 stroke-gray-600" />
                <span>{documentsCount} سند</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl shadow-sm">
                  <FileCode className="w-5 h-5 stroke-amber-600" />
                </div>
                <CardTitle>گزینه‌ها</CardTitle>
              </div>
              <Badge variant="amber">
                {optionsCount} مورد
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              گزینه‌های اضافی مرتبط با نمونه کار
            </p>
            {portfolio.options && portfolio.options.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {portfolio.options.map((option) => (
                  <Badge
                    key={option.id}
                    variant="outline"
                    className="cursor-default"
                  >
                    {option.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                گزینه‌ای انتخاب نشده است
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-all duration-300 border-b-4 border-b-cyan-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-100 rounded-xl shadow-sm">
              <FileText className="w-5 h-5 stroke-cyan-600" />
            </div>
            <div>توضیحات</div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-muted-foreground mb-3 block">
              توضیحات کوتاه
            </label>
            <div className="text-foreground leading-relaxed p-4 bg-muted/50 rounded-lg" style={{ textAlign: 'justify' }}>
              {portfolio.short_description || (
                <span className="text-muted-foreground">
                  توضیحی وارد نشده است
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-muted-foreground mb-3 block">
              توضیحات کامل
            </label>
            <div className="p-4 bg-muted/50 rounded-lg" style={{ textAlign: 'justify' }}>
              {portfolio.description ? (
                <ReadMore
                  content={portfolio.description}
                  isHTML={true}
                  maxHeight="200px"
                />
              ) : (
                <span className="text-muted-foreground">
                  توضیحی وارد نشده است
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

