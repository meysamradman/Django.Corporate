import { CardWithIcon } from "@/components/elements/CardWithIcon";
import type { Blog } from "@/types/blog/blog";
import { Badge } from "@/components/elements/Badge";
import { ReadMore } from "@/components/elements/ReadMore";
import { Item, ItemContent, ItemMedia } from "@/components/elements/Item";
import {
  FileText,
  Eye,
  Globe,
  Smartphone,
  Heart,
  Calendar,
  Activity,
  Video as VideoIcon,
  Image as ImageIcon,
  Music
} from "lucide-react";
import { formatDate } from "@/core/utils/commonFormat";

interface OverviewTabProps {
  blog: Blog;
}

export function BlogOverview({ blog }: OverviewTabProps) {
  const allMedia = blog.blog_media || [];
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
    (item: any) => {
      const media = item.media_detail || item.media;
      return media?.media_type === "document" || media?.media_type === "pdf";
    }
  ).length;

  return (
    <div id="section-overview" className="scroll-mt-32 space-y-6">
      <CardWithIcon
        icon={FileText}
        title="مشخصات و محتوای وبلاگ"
        iconBgColor="bg-blue-0/50"
        iconColor="text-blue-1"
        cardBorderColor="border-b-blue-1"
        className="shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0 text-font-p">
          <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
            <ItemMedia className="text-blue-1/60">
              <Calendar className="size-4" />
            </ItemMedia>
            <ItemContent className="flex-row items-center gap-2">
              <span className="text-[10px] font-bold text-font-s">تاریخ انتشار:</span>
              <span className="text-xs font-black">
                {blog.created_at ? formatDate(blog.created_at) : "نامشخص"}
              </span>
            </ItemContent>
          </Item>

          <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
            <ItemMedia className="text-purple-1/60">
              <FileText className="size-4" />
            </ItemMedia>
            <ItemContent className="flex-row items-center gap-2">
              <span className="text-[10px] font-bold text-font-s">وضعیت سیستمی:</span>
              <span className="text-xs font-black text-emerald-1">
                {blog.is_active ? 'فعال' : 'غیرفعال'}
              </span>
            </ItemContent>
          </Item>

          <Item size="sm" className="rounded-none border-x-0 border-t-0 border-b border-br/40 last:border-0 hover:bg-bg/40 transition-colors">
            <ItemMedia className="text-emerald-1/60">
              <Globe className="size-4" />
            </ItemMedia>
            <ItemContent className="flex-row items-center gap-2">
              <span className="text-[10px] font-bold text-font-s">دسترسی:</span>
              <span className="text-xs font-black">
                {blog.is_public ? 'عمومی' : 'خصوصی'}
              </span>
            </ItemContent>
          </Item>
        </div>

        <div className="flex flex-col gap-6 mt-6 pt-6 border-t border-br/40">
          <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
              توضیحات کوتاه
            </label>
            <div className="text-sm text-font-p border-r-2 border-blue-1/30 pr-4 leading-relaxed">
              {blog.short_description || "توضیحی وارد نشده است"}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-font-s tracking-wider mb-2 block">
              محتوای کامل
            </label>
            <div className="text-sm text-font-p bg-bg/50 rounded-xl overflow-hidden leading-loose">
              {blog.description ? (
                <div className="p-5">
                  <ReadMore content={blog.description} isHTML={true} maxHeight="400px" />
                </div>
              ) : (
                <div className="p-5 text-font-s italic text-center text-balance">محتوایی ثبت نشده است</div>
              )}
            </div>
          </div>
        </div>
      </CardWithIcon>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CardWithIcon
          icon={Activity}
          title="آمار و وضعیت"
          iconBgColor="bg-teal-0/50"
          iconColor="text-teal-1"
          cardBorderColor="border-b-teal-1"
          className="shadow-sm"
          contentClassName=""
          showHeaderBorder={false}
          titleExtra={(() => {
            const statusMap: Record<string, { label: string; variant: any }> = {
              published: { label: "منتشر شده", variant: "green" },
              draft: { label: "پیش‌نویس", variant: "yellow" },
            };
            const config = statusMap[blog.status] || { label: blog.status, variant: "gray" };
            return <Badge variant={config.variant}>{config.label}</Badge>;
          })()}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
              <Eye className="w-4 h-4 text-blue-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{blog.views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید کل</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
              <Globe className="w-4 h-4 text-emerald-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{blog.web_views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید وب</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-blue-1/30 transition-all">
              <Smartphone className="w-4 h-4 text-purple-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{blog.app_views_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">بازدید اپ</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-red-1/30 transition-all">
              <Heart className="w-4 h-4 text-red-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{blog.favorites_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">علاقه‌مندی</span>
            </div>

            <div className="p-4 rounded-xl bg-bg border border-br/50 flex flex-col items-center gap-2 group hover:border-orange-1/30 transition-all">
              <Activity className="w-4 h-4 text-orange-1 opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="text-lg font-black text-font-p">{(blog as any).comments_count?.toLocaleString('fa-IR') || "۰"}</span>
              <span className="text-[10px] font-bold text-font-s tracking-wider text-center">نظرات</span>
            </div>
          </div>
        </CardWithIcon>

        <CardWithIcon
          icon={ImageIcon}
          title="خلاصه رسانه‌ها"
          iconBgColor="bg-blue-0/50"
          iconColor="text-blue-1"
          cardBorderColor="border-b-blue-1"
          className="shadow-sm"
          contentClassName=""
          showHeaderBorder={false}
          titleExtra={<Badge variant="blue">{allMedia.length} فایل</Badge>}
        >
          <div className="grid grid-cols-2 gap-3 h-full content-start">
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">تصویر</span>
              </div>
              <span className="font-bold text-font-p">{imagesCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-purple-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">ویدیو</span>
              </div>
              <span className="font-bold text-font-p">{videosCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">صدا</span>
              </div>
              <span className="font-bold text-font-p">{audiosCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-br/50 group">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-1 opacity-70" />
                <span className="text-xs font-bold text-font-s">سند</span>
              </div>
              <span className="font-bold text-font-p">{documentsCount}</span>
            </div>
          </div>
        </CardWithIcon>
      </div>
    </div>
  );
}



