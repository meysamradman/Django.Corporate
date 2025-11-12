"use client";

import { TabsContent } from "@/components/elements/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/elements/Card";
import { CardWithIcon } from "@/components/elements/CardWithIcon";
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
        <CardWithIcon
          icon={FolderOpen}
          title="دسته‌بندی‌ها"
          iconBgColor="bg-purple"
          iconColor="stroke-purple-2"
          borderColor="border-b-purple-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="purple">{categoriesCount} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              دسته‌بندی‌های مرتبط با این نمونه کار
            </p>
            {portfolio.categories && portfolio.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {portfolio.categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="purple"
                    className="cursor-default"
                    title={renderCategoryPath(category)}
                  >
                    <FolderOpen className="w-3 h-3 me-1" />
                    {category.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-font-s">
                دسته‌بندی‌ای انتخاب نشده است
              </p>
            )}
        </CardWithIcon>

        <CardWithIcon
          icon={Tag}
          title="تگ‌ها"
          iconBgColor="bg-indigo"
          iconColor="stroke-indigo-2"
          borderColor="border-b-indigo-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="indigo">{tagsCount} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              برچسب‌های مرتبط با این نمونه کار
            </p>
            {portfolio.tags && portfolio.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {portfolio.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="indigo"
                    className="cursor-default"
                  >
                    <Tag className="w-3 h-3 me-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-font-s">
                تگی انتخاب نشده است
              </p>
            )}
        </CardWithIcon>

        <CardWithIcon
          icon={ImageIcon}
          title="مدیا"
          iconBgColor="bg-blue"
          iconColor="stroke-blue-2"
          borderColor="border-b-blue-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="blue">{portfolio.media_count || 0} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              تعداد کل رسانه‌های آپلود شده
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-blue rounded">
                <ImageIcon className="w-4 h-4 stroke-blue-2" />
                <span>{imagesCount} تصویر</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-purple rounded">
                <Video className="w-4 h-4 stroke-purple-2" />
                <span>{videosCount} ویدیو</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-pink rounded">
                <Music className="w-4 h-4 stroke-pink-2" />
                <span>{audiosCount} صدا</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray rounded">
                <FileText className="w-4 h-4 stroke-gray-2" />
                <span>{documentsCount} سند</span>
              </div>
            </div>
        </CardWithIcon>

        <CardWithIcon
          icon={FileCode}
          title="گزینه‌ها"
          iconBgColor="bg-teal"
          iconColor="stroke-teal-2"
          borderColor="border-b-teal-1"
          headerClassName="pb-3"
          titleExtra={<Badge variant="teal">{optionsCount} مورد</Badge>}
        >
            <p className="text-font-s mb-4">
              گزینه‌های اضافی مرتبط با نمونه کار
            </p>
            {portfolio.options && portfolio.options.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {portfolio.options.map((option) => (
                  <Badge
                    key={option.id}
                    variant="teal"
                    className="cursor-default"
                  >
                    {option.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-font-s">
                گزینه‌ای انتخاب نشده است
              </p>
            )}
        </CardWithIcon>
      </div>

      <CardWithIcon
        icon={FileText}
        title="توضیحات"
        iconBgColor="bg-blue"
        iconColor="stroke-blue-2"
        borderColor="border-b-blue-1"
        contentClassName="space-y-6"
      >
          <div>
            <label className="text-font-s mb-3 block">
              توضیحات کوتاه
            </label>
            <div className="text-font-p leading-relaxed p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
              {portfolio.short_description || (
                <span className="text-font-s">
                  توضیحی وارد نشده است
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-font-s mb-3 block">
              توضیحات کامل
            </label>
            <div className="p-4 bg-bg/50 rounded-lg" style={{ textAlign: 'justify' }}>
              {portfolio.description ? (
                <ReadMore
                  content={portfolio.description}
                  isHTML={true}
                  maxHeight="200px"
                />
              ) : (
                <span className="text-font-s">
                  توضیحی وارد نشده است
                </span>
              )}
            </div>
          </div>
      </CardWithIcon>
    </TabsContent>
  );
}

